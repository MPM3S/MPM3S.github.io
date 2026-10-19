"""Write anchor_design_parts.tex, the generated parts of anchor_design.tex: the AC-14 fluke
and shank read from the MPM3S STL files and drawn as shaded triangles, seen from above
(both halves, mirrored about the centre line) and from the side with the hinge opened to its
35 degree limit, and the side-view positions of the points and constraint anchors.
Lengths are in metres, in the frame of the input file as drawn (before "offset").
Run:  python3 anchor_design_parts.py path/to/MPM3S/validation_data_and_jsons
"""
import struct, sys, pathlib
import numpy as np

pivot = np.array([0.489, 0.0, 0.0])        # "rotation centre" of the hinge
fluke_down, shank_up = 20.0, 15.0          # degrees; together the 35 degree "angle limit"

def triangles(path):
    raw = pathlib.Path(path).read_bytes()
    if raw[:5] == b"solid" and b"facet" in raw[:300]:
        v = [list(map(float, l.split()[1:4])) for l in raw.decode().splitlines() if l.strip().startswith("vertex")]
        return np.array(v).reshape(-1, 3, 3)
    n = struct.unpack("<I", raw[80:84])[0]
    rec = np.frombuffer(raw[84:84 + 50 * n], dtype=np.dtype([("n", "<3f4"), ("v", "<9f4"), ("a", "<u2")]))
    return rec["v"].reshape(-1, 3, 3).astype(float)

def rot_y(p, deg):
    """rotate about the hinge axis (y through the pivot); positive lifts +x upwards"""
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    d = p - pivot
    return pivot + np.stack([c * d[..., 0] - s * d[..., 2], d[..., 1], s * d[..., 0] + c * d[..., 2]], -1)

def faces(parts, view, light, depth, keep):
    """the visible faces of the closed surfaces in `parts`, far to near, as (depth, "face",
    shade, 2D triangle), followed by the visible stretches of each part's silhouette - the
    edges between a face turned towards the viewer and one turned away - as ("edge", 2D
    segment). An edge is sampled along its length, and a sample is hidden when a nearer
    visible face covers it, so only the outline that can be seen is drawn."""
    shown, silhouette = [], []
    for tris in parts:
        edges = {}
        for t in tris:
            n = np.cross(t[1] - t[0], t[2] - t[0]); n /= np.linalg.norm(n)
            front = bool(keep(n))
            keys = [tuple(v.round(6)) for v in t]
            for a, b in ((0, 1), (1, 2), (2, 0)):
                edges.setdefault(tuple(sorted((keys[a], keys[b]))), []).append(front)
            if front:
                shown.append((depth(t.mean(0)), 0.35 + 0.65 * max(0.0, n @ light), t))
        silhouette += [(np.array(a), np.array(b)) for (a, b), sides in edges.items()
                       if any(sides) and (not all(sides) or len(sides) == 1)]
    shown.sort(key=lambda f: f[0])
    tri3 = np.array([t for _, _, t in shown])                        # (F, 3, 3)
    tri2 = tri3[:, :, view]                                          # (F, 3, 2)
    tdep = np.array([[depth(v) for v in t] for t in tri3])           # (F, 3)
    T = np.stack([tri2[:, 1] - tri2[:, 0], tri2[:, 2] - tri2[:, 0]], -1)   # (F, 2, 2)
    ok = np.abs(np.linalg.det(T)) > 1e-12
    Tinv = np.zeros_like(T); Tinv[ok] = np.linalg.inv(T[ok])
    segments = []
    for a, b in silhouette:
        s_ = np.linspace(0, 1, 41)[:, None]
        P = a + s_ * (b - a)                                         # (S, 3)
        p2, pd = P[:, view], np.array([depth(q) for q in P])
        lam = np.einsum("fij,fsj->fsi", Tinv, p2[None] - tri2[:, None, 0])   # (F, S, 2)
        l1, l2 = lam[..., 0], lam[..., 1]; l0 = 1 - l1 - l2
        inside = ok[:, None] & (l0 > 1e-4) & (l1 > 1e-4) & (l2 > 1e-4)
        fd = l0 * tdep[:, None, 0] + l1 * tdep[:, None, 1] + l2 * tdep[:, None, 2]
        hidden = (inside & (fd > pd[None] + 1e-4)).any(0)
        k = 0
        while k < len(hidden):                                       # runs of visible samples
            if hidden[k]: k += 1; continue
            m = k
            while m + 1 < len(hidden) and not hidden[m + 1]: m += 1
            if m > k: segments.append((p2[k], p2[m]))
            k = m + 1
    return [(d, "face", sh, t[:, view]) for d, sh, t in shown] + [(None, "edge", a, b) for a, b in segments]


def tikz(items):
    lines = []
    for item in items:
        if item[1] == "edge":
            a, b = item[2], item[3]
            lines.append(f"  \\draw[black, line width=0.5pt, line cap=round] ({a[0]:.4f},{a[1]:.4f}) -- ({b[0]:.4f},{b[1]:.4f});")
            continue
        shade, t = item[2], item[3]
        pct = int(round(12 + 30 * (1 - shade)))   # grey: lighter where the face turns to the light
        pts = " -- ".join(f"({a:.4f},{b:.4f})" for a, b in t)
        lines.append(f"  \\filldraw[fill=black!{pct}!white, draw=black!{pct}!white, line width=0.15pt, line join=round] {pts} -- cycle;")
    return "\n".join(lines)

folder = pathlib.Path(sys.argv[1])
fluke, shank = triangles(folder / "fluke_round_nose.stl"), triangles(folder / "shank_scv2.stl")
unit = lambda v: np.array(v) / np.linalg.norm(v)

# top view: looking down -z, both halves (the mirror image reverses the winding)
mirror = lambda t: t[:, ::-1] * np.array([1, -1, 1])
top_faces = faces([fluke, mirror(fluke), shank, mirror(shank)], [0, 1], unit([-0.3, 0.5, 1.0]), lambda c: c[2], lambda n: n[2] > 0)

# side view: looking along +y, the fluke turned down and the shank up about the hinge
side_faces = faces([rot_y(fluke, -fluke_down), rot_y(shank, shank_up)], [0, 2], unit([-0.4, -1.0, 0.6]), lambda c: -c[1], lambda n: n[1] < 0)

pts = {   # side-view (x, z) of the points and constraint anchors
    "hinge": pivot, "fluke com": rot_y(np.array([0.62, 0, 0]), -fluke_down),
    "shank com": rot_y(np.array([1.7592, 0, 0]), shank_up), "eyelet": rot_y(np.array([3.0294, 0, 0]), shank_up),
    "tip": rot_y(np.array([2.0906, 0, 0]), -fluke_down),
    "stop fluke": rot_y(np.array([0.62, 0, 0]), -fluke_down), "stop shank": rot_y(np.array([0.62, 0, 0]), shank_up)}
coords = "\n".join(f"  \\coordinate ({k.replace(' ', '')}) at ({p[0]:.4f},{p[2]:.4f});" for k, p in pts.items())

out = ["% generated by anchor_design_parts.py from fluke_round_nose.stl and shank_scv2.stl - do not edit",
       "\\newcommand{\\anchortop}{%", tikz(top_faces), "}",
       "\\newcommand{\\anchorside}{%", tikz(side_faces), "}",
       "\\newcommand{\\sidepoints}{%", coords, "}"]
pathlib.Path(__file__).with_name("anchor_design_parts.tex").write_text("\n".join(out) + "\n")
count = lambda items, kind: sum(i[1] == kind for i in items)
print(count(top_faces, "face"), "top faces,", count(top_faces, "edge"), "outline edges;", count(side_faces, "face"), "side faces,", count(side_faces, "edge"), "outline edges")
for k, p in pts.items(): print(f"  {k:10s} x {p[0]:.3f}  z {p[2]:.3f}")
