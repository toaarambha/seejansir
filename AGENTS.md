<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Portfolio print layout lives in mm in src/lib/portfolio.ts (LAYOUT); both the on-screen A4 preview and the jsPDF export read it so they stay identical.
- Data (portfolios, batches, settings, photos) is stored in browser IndexedDB via idb-keyval; no backend yet.
