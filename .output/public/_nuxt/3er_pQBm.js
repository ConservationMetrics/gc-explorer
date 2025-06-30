const l = (e, t) => {
    if (!e) return [];
    const s = [];
    return (
      Object.keys(e).forEach((r) => {
        if (typeof e[r] != "string" || e[r].includes("attachment")) return;
        e[r].split(",").forEach((a) => {
          if (
            Object.values(t).some((n) => n.some((o) => a.trim().endsWith(o)))
          ) {
            const n = a
              .trim()
              .replace(/ /g, "_")
              .replace(/^\['|'\]$/g, "");
            s.push(n);
          }
        });
      }),
      s
    );
  },
  p = (e) =>
    e
      .toLowerCase()
      .replace(/_([a-z0-9])/g, (t, s) => s.toUpperCase())
      .replace(/(^\w)/, (t) => t.toLowerCase()),
  h = (e) => e.replace(/_/g, " ");
export { l as g, h as r, p as t };
