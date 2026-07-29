import { useNavigate } from "react-router-dom";
import Layout from "../layouts/Layout/Layout";

function MainMenu() {

    const navigate = useNavigate();

    return (

        <Layout title="A Living Grand Strategy">

            <div className="menu">

                <button onClick={() => navigate("/scenario")}>
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

        </Layout>

    );

}

export default MainMenu;