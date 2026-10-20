"""Write anchor_design_parts.tex, the generated parts of anchor_design.tex: the AC-14 fluke
and shank read from the MPM3S STL files and drawn as shaded triangles, seen from above
(both halves, mirrored about the centre line, with the fluke turned back level so the plan
shows its true shape) and from the side as set up in the input file - the fluke turned
20 degrees tip-down about the hinge, as AC14_fluke_rot20.stl is drawn - and the side-view
positions of the points. Lengths are in metres, in the frame of the input file as drawn
(before "offset").
Run:  python3 anchor_design_parts.py path/to/MPM3S/validation_data_and_jsons
"""
import struct, sys, pathlib
import numpy as np

pivot = np.array([0.489, 0.0, 0.0])        # "rotation centre" of the hinge
fluke_down = 20.0                          # degrees; AC14_fluke_rot20.stl is turned tip-down by this

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

    def hidden(P):
        """is each 3D point in P (S, 3) behind a visible face? The margins keep an edge from
        being hidden by the faces it borders"""
        p2, pd = P[:, view], np.array([depth(q) for q in P])
        lam = np.einsum("fij,fsj->fsi", Tinv, p2[None] - tri2[:, None, 0])   # (F, S, 2)
        l1, l2 = lam[..., 0], lam[..., 1]; l0 = 1 - l1 - l2
        inside = ok[:, None] & (l0 > 1e-3) & (l1 > 1e-3) & (l2 > 1e-3)
        fd = l0 * tdep[:, None, 0] + l1 * tdep[:, None, 1] + l2 * tdep[:, None, 2]
        return (inside & (fd > pd[None] + 2e-3)).any(0)

    def boundary(a, b, s0, s1):
        """bisect between a visible parameter s0 and a hidden s1 along a-b for where the edge
        disappears, so the visible stretch runs right up to the covering face"""
        for _ in range(12):
            m = 0.5 * (s0 + s1)
            if hidden((a + m * (b - a))[None])[0]: s1 = m
            else: s0 = m
        return s0

    segments = []
    for a, b in silhouette:
        s_ = np.linspace(0, 1, 81)
        hid = hidden(a + s_[:, None] * (b - a))
        k = 0
        while k < len(hid):                                          # runs of visible samples
            if hid[k]: k += 1; continue
            m = k
            while m + 1 < len(hid) and not hid[m + 1]: m += 1
            lo = s_[k] if k == 0 else boundary(a, b, s_[k], s_[k - 1])
            hi = s_[m] if m == len(hid) - 1 else boundary(a, b, s_[m], s_[m + 1])
            if hi - lo > 1e-6: segments.append(((a + lo * (b - a))[view], (a + hi * (b - a))[view]))
            k = m + 1
    long = lambda c: sum(np.linalg.norm(np.subtract(q, p)) for p, q in zip(c, c[1:])) > 0.01   # drop specks under 1 cm
    return [(d, "face", sh, t[:, view]) for d, sh, t in shown] + [(None, "edge", c) for c in chains(segments) if long(c)]


def chains(segments, tol=1e-5):
    """join segments that share end points into polylines, so the outline is drawn as
    continuous lines with clean joins rather than separate pieces"""
    key = lambda p: (round(p[0] / tol), round(p[1] / tol))
    ends = {}
    for i, (a, b) in enumerate(segments):
        ends.setdefault(key(a), []).append((i, 0)); ends.setdefault(key(b), []).append((i, 1))
    used, out = set(), []
    def walk(i):
        line = [segments[i][0], segments[i][1]]
        while True:
            nxt = [(j, e) for j, e in ends.get(key(line[-1]), []) if j not in used]
            if len(nxt) != 1: return line
            j, e = nxt[0]; used.add(j)
            line.append(segments[j][1 - e])
    for i in range(len(segments)):
        if i in used: continue
        used.add(i)
        out.append(walk(i))
    # one more pass: a chain may continue backwards from its start
    merged = True
    while merged:
        merged = False
        for x in range(len(out)):
            for y in range(len(out)):
                if x != y and out[x] and out[y] and key(out[x][-1]) == key(out[y][0]):
                    out[x] = out[x] + out[y][1:]; out[y] = None; merged = True
        out = [c for c in out if c]
    return out


def tikz(items):
    lines = []
    for item in items:
        if item[1] == "edge":
            pts = " -- ".join(f"({x:.4f},{y:.4f})" for x, y in item[2])
            lines.append(f"  \\draw[black, line width=0.5pt, line cap=round, line join=round] {pts};")
            continue
        shade, t = item[2], item[3]
        pct = int(round(12 + 30 * (1 - shade)))   # grey: lighter where the face turns to the light
        pts = " -- ".join(f"({a:.4f},{b:.4f})" for a, b in t)
        lines.append(f"  \\filldraw[fill=black!{pct}!white, draw=black!{pct}!white, line width=0.15pt, line join=round] {pts} -- cycle;")
    return "\n".join(lines)

folder = pathlib.Path(sys.argv[1])
fluke, shank = triangles(folder / "AC14_fluke_rot20.stl"), triangles(folder / "AC14_shank.stl")
level = rot_y(fluke, fluke_down)          # the fluke turned back level, for the plan view
unit = lambda v: np.array(v) / np.linalg.norm(v)

# top view: looking down -z, both halves (the mirror image reverses the winding)
mirror = lambda t: t[:, ::-1] * np.array([1, -1, 1])
top_faces = faces([level, mirror(level), shank, mirror(shank)], [0, 1], unit([-0.3, 0.5, 1.0]), lambda c: c[2], lambda n: n[2] > 0.02)

# side view: looking along +y, the anchor as set up (the fluke already turned down)
side_faces = faces([fluke, shank], [0, 2], unit([-0.4, -1.0, 0.6]), lambda c: -c[1], lambda n: n[1] < -0.02)

pts = {   # side-view (x, z) of the points, as in input_data_AC14_dr32.json
    "hinge": pivot, "fluke com": np.array([0.6121, 0, -0.044805]), "shank com": np.array([1.7592, 0, 0]),
    "eyelet": np.array([3.0294, 0, 0]), "tip": np.array([1.994, 0, -0.5478]),
    "pull": np.array([12.51226633, 0, -0.5703035])}
coords = "\n".join(f"  \\coordinate ({k.replace(' ', '')}) at ({p[0]:.4f},{p[2]:.4f});" for k, p in pts.items())

out = ["% generated by anchor_design_parts.py from AC14_fluke_rot20.stl and AC14_shank.stl - do not edit",
       "\\newcommand{\\anchortop}{%", tikz(top_faces), "}",
       "\\newcommand{\\anchorside}{%", tikz(side_faces), "}",
       "\\newcommand{\\sidepoints}{%", coords, "}"]
pathlib.Path(__file__).with_name("anchor_design_parts.tex").write_text("\n".join(out) + "\n")
count = lambda items, kind: sum(i[1] == kind for i in items)
print(count(top_faces, "face"), "top faces,", count(top_faces, "edge"), "outline edges;", count(side_faces, "face"), "side faces,", count(side_faces, "edge"), "outline edges")
for k, p in pts.items(): print(f"  {k:10s} x {p[0]:.3f}  z {p[2]:.3f}")
