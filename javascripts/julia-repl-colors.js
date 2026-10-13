/* Post-pass that colours the well-known Julia REPL / Pkg keywords
 * inside .terminal blocks, to match the colours users see in a real
 * Julia session. The `console` Pygments lexer wraps everything
 * except the leading `$` prompt in a single `.go` span, so without
 * this pass the output reads as a uniform light block.
 *
 * Brand colours from julialang.org/assets/infra/logo.svg:
 *   green  #389826 — used for `julia>` prompts and Pkg verbs that
 *                    indicate normal progression (Resolving, Project,
 *                    Updating, Installed)
 *   red    #CB3C33 — Manifest, errors
 *   purple #9558B2 — Activating, Pkg-mode prompts
 *   cyan   #5cbeff — Info messages, `From worker N:` prefixes
 *                    (the cyan isn't a brand colour but it's the
 *                    convention the Julia stdlib uses for these)
 */
(function () {
  var RULES = [
    { re: /\b(Resolving|Project|Updating|Installed|Downloaded)\b/g, cls: 'repl-green'  },
    { re: /\b(Manifest)\b/g,                                       cls: 'repl-red'    },
    { re: /\b(Activating)\b/g,                                     cls: 'repl-purple' },
    { re: /(From worker \d+:)/g,                                   cls: 'repl-cyan'   },
    { re: /\b(Info|Warning|Error)\b/g,                             cls: 'repl-cyan'   },
    { re: /(julia&gt;)/g,                                          cls: 'repl-green'  },
    { re: /(pkg&gt;)/g,                                            cls: 'repl-purple' },
    { re: /(shell&gt;)/g,                                          cls: 'repl-red'    },
  ];

  function colourise(terminal) {
    terminal.querySelectorAll('.highlight code').forEach(function (code) {
      var html = code.innerHTML;
      RULES.forEach(function (rule) {
        html = html.replace(rule.re, '<span class="' + rule.cls + '">$1</span>');
      });
      code.innerHTML = html;
    });
  }

  function init() {
    document.querySelectorAll('.terminal').forEach(colourise);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
