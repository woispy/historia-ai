function Layout({ title, children }) {
  return (
    <div className="app">

      <h1>HISTORIA AI</h1>

      <h2>{title}</h2>

      <hr />

      {children}

    </div>
  );
}

export default Layout;