function Layout({ title, children }) {
  const isGamePage = title === "";

  return (
    <div className="app">

      {!isGamePage && (
        <>
          <h1>👑 HISTORIA AI</h1>

          <h3>{title}</h3>

          <p className="game-description">
            Yapay zekâ ile yaşayan dinamik bir büyük strateji deneyimi.
          </p>
        </>
      )}

      {children}

    </div>
  );
}

export default Layout;