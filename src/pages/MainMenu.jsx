import { useNavigate } from "react-router-dom";

function MainMenu() {

    const navigate = useNavigate();

    return (

        <div className="app">

            <h1>HISTORIA AI</h1>

            <h3>A Living Grand Strategy</h3>

            <div className="menu">

                <button onClick={() => navigate("/new-game")}>

                    🗡 Yeni Oyun

                </button>

                <button>

                    💾 Devam Et

                </button>

                <button onClick={() => navigate("/settings")}>

                    ⚙ Ayarlar

                </button>

                <button>

                    🚪 Çıkış

                </button>

            </div>

        </div>

    );

}

export default MainMenu;