/** Blocking theme script for <head> — avoids React 19 client-component script warnings. */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("theme");var d=document.documentElement;var m=window.matchMedia("(prefers-color-scheme: dark)").matches;d.classList.toggle("dark",t==="dark"||(!t||t==="system")&&m)}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
