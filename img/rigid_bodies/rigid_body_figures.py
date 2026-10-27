"""Write rigid_body_parts.tex, the generated parts of rigid_body_figures.tex: the figures of the
rigid bodies page, in the style of Tutorial 6's anchor_setup.png (the same oblique view, red-shaded
bodies, purple annotation). One figure shows a surface welded to its point; four show the
constraint types:
  (a) "coincidence"   - a ball joint: two anchors held together;
  (b) "rotation lock" - a hinge: a pin at the rotation centre and the two axes kept aligned;
  (c) "distance lock" - a rod: two anchors held a fixed distance apart;
  (d) "distance stop" - an angle stop: slack until the chord between its anchors reaches s.
Each panel shows two bars, each welded to its point (drawn at its centre of mass), with the
arms from the points to their anchors.
Run:  python3 rigid_body_figures.py
      pdflatex rigid_body_figures.tex
      then one PNG per page (see rigid_body_figures.tex)
"""
import pathlib
import numpy as np

view = np.array([1.0, -2.0, 0.8]) / np.linalg.norm([1.0, -2.0, 0.8])     # towards the viewer
light = np.array([0.4, -0.5, 1.0]) / np.linalg.norm([0.4, -0.5, 1.0])


def rot_y(p, deg, c):
    """rotate about the y axis through c; positive lifts +x upwards"""
    a = np.radians(deg); cs, sn = np.cos(a), np.sin(a)
    d = np.asarray(p, float) - c
    return c + np.array([cs * d[0] - sn * d[2], d[1], sn * d[0] + cs * d[2]])


def rot_z(p, deg, c):
    a = np.radians(deg); cs, sn = np.cos(a), np.sin(a)
    d = np.asarray(p, float) - c
    return c + np.array([cs * d[0] - sn * d[1], sn * d[0] + cs * d[1], d[2]])


def box(lo, hi, move=lambda p: p):
    """the six faces of a box, each (corners, outward normal), after `move` (a rigid motion)"""
    x0, y0, z0 = lo; x1, y1, z1 = hi
    quads = [([(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)], (0, -1, 0)),
             ([(x0, y1, z0), (x0, y1, z1), (x1, y1, z1), (x1, y1, z0)], (0, 1, 0)),
             ([(x0, y0, z0), (x0, y0, z1), (x0, y1, z1), (x0, y1, z0)], (-1, 0, 0)),
             ([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], (1, 0, 0)),
             ([(x0, y0, z0), (x0, y1, z0), (x1, y1, z0), (x1, y0, z0)], (0, 0, -1)),
             ([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], (0, 0, 1))]
    out = []
    for q, n in quads:
        Q = np.array([move(np.array(v, float)) for v in q])
        N = move(np.array(n, float)) - move(np.zeros(3))          # the normal turns with the box
        out.append((Q, N / np.linalg.norm(N)))
    return out


def solid(faces, ghost=False):
    """the visible faces, far to near, as TikZ: shaded red with black edges (as the anchor in
    anchor_setup.png), or a dashed red outline for a ghost position"""
    shown = sorted([(Q.mean(0) @ view, Q, N) for Q, N in faces if N @ view > 1e-9], key=lambda f: f[0])
    lines = []
    for _, Q, N in shown:
        pts = " -- ".join(f"({x:.4f},{y:.4f},{z:.4f})" for x, y, z in Q)
        if ghost:
            lines.append(f"  \\draw[ghost] {pts} -- cycle;")
        else:
            pct = int(round(10 + 35 * (1 - (0.35 + 0.65 * max(0.0, N @ light)))))
            lines.append(f"  \\filldraw[body, fill=rigidred!{pct}!white] {pts} -- cycle;")
    return lines


c3 = lambda p: f"({p[0]:.4f},{p[1]:.4f},{p[2]:.4f})"
coord = lambda name, p: f"  \\coordinate ({name}) at {c3(p)};"
centre = np.array([0.0, 0.4, 0.0])              # the pin of the hinge panels, between the two bars
bar_a = ((-0.15, 0.0, -0.1), (1.6, 0.2, 0.1))
bar_b = ((-0.15, 0.6, -0.1), (1.6, 0.8, 0.1))
panels = []

# (a) coincidence: two bars end to end, joined at one anchor; B turned freely about it
joint = np.array([1.75, 0.15, 0.0])
move_b = lambda p: rot_z(rot_y(p, 25.0, joint), 18.0, joint)
A = box((0.0, 0.0, -0.12), (1.6, 0.3, 0.12))
B = box((1.9, 0.0, -0.12), (3.5, 0.3, 0.12), move_b)
panels.append(("a", solid(A + B), [coord("pa", (0.8, 0.15, 0.0)), coord("pb", move_b(np.array([2.7, 0.15, 0.0]))),
                                   coord("joint", joint)]))

# (b) rotation lock: two bars side by side, pinned on the y axis through the centre (a hinge)
psi_b = 25.0
move_h = lambda p: rot_y(p, psi_b, centre)
A = box(*bar_a); B = box(*bar_b, move_h)
panels.append(("b", solid(A + B), [coord("pa", (0.8, 0.1, 0.0)), coord("pb", move_h(np.array([0.8, 0.7, 0.0]))),
                                   coord("pin", centre), coord("axlo", centre + (0, -0.75, 0)), coord("axhi", centre + (0, 0.75, 0)),
                                   coord("tipa", (1.6, 0.1, 0.0)), coord("tipb", move_h(np.array([1.6, 0.7, 0.0])))]))

# (c) distance lock: two bars apart, a rod between an anchor on each
lift = lambda p: rot_y(p, -12.0, np.array([2.9, 0.15, 0.0])) + np.array([0, 0, 0.35])
A = box((0.0, 0.0, -0.12), (1.3, 0.3, 0.12))
B = box((2.6, 0.0, -0.12), (3.9, 0.3, 0.12), lift)
panels.append(("c", solid(A + B), [coord("pa", (0.65, 0.15, 0.0)), coord("pb", lift(np.array([3.25, 0.15, 0.0]))),
                                   coord("an1", (1.15, 0.0, 0.0)), coord("an2", lift(np.array([2.75, 0.0, 0.0])))]))

# (d) distance stop: the hinge of (b), opened to psi, with its limit psi_max as a ghost
psi_d, psi_max = 20.0, 42.0
move_d = lambda p: rot_y(p, psi_d, centre)
move_m = lambda p: rot_y(p, psi_max, centre)
A = box(*bar_a); B = box(*bar_b, move_d); G = box(*bar_b, move_m)
l = 1.25                                          # the anchors' distance from the centre
panels.append(("d", solid(G, ghost=True) + solid(A + B),
               [coord("pa", (0.55, 0.1, 0.0)), coord("pb", move_d(np.array([0.55, 0.7, 0.0]))), coord("pin", centre),
                coord("axlo", centre + (0, -0.75, 0)), coord("axhi", centre + (0, 0.75, 0)),
                coord("an1", (l, 0.4, 0.0)), coord("an2", move_d(np.array([l, 0.4, 0.0]))),
                coord("an2max", move_m(np.array([l, 0.4, 0.0])))]))

# (e) a surface welded to its point: the body at the start (ghost) and moved and turned with its point
start = lambda p: np.asarray(p, float)
moved = lambda p: rot_y(rot_z(np.asarray(p, float), 12.0, np.array([1.2, 0.4, 0.25])), 10.0, np.array([1.2, 0.4, 0.25])) + np.array([3.4, 0.0, 0.55])
lo, hi = (0.0, 0.0, 0.0), (2.4, 0.8, 0.5)
G = box(lo, hi); E = box(lo, hi, moved)
corners = {"c1": (2.4, 0.0, 0.5), "c2": (0.0, 0.0, 0.5), "c3": (2.4, 0.0, 0.0), "c4": (2.4, 0.8, 0.5)}
panels.append(("e", solid(G, ghost=True) + solid(E),
               [coord("p0", start((1.2, 0.4, 0.25))), coord("pe", moved((1.2, 0.4, 0.25))),
                coord("hit", moved((2.4, 0.3, 0.12)))] + [coord(k, moved(v)) for k, v in corners.items()]))

out = ["% generated by rigid_body_figures.py - the bodies and points of each figure - do not edit"]
for name, faces, coords in panels:
    out.append(f"\\newcommand{{\\panel{name}}}{{%")
    out += coords + faces
    out.append("}")
pathlib.Path(__file__).with_name("rigid_body_parts.tex").write_text("\n".join(out) + "\n")
print("wrote rigid_body_parts.tex:", ", ".join(f"({n}) {sum('filldraw' in f or 'ghost' in f for f in fc)} faces" for n, fc, _ in panels))
