import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function CountrySelect() {

    const navigate = useNavigate();

    return (

        <Layout title="Ülke Seç">

            <h3>Şimdilik örnek ülkeler</h3>

            <div className="menu">

                <button>🏛 Osmanlı Beyliği</button>

                <button>🦅 Bizans İmparatorluğu</button>

                <button>👑 İngiltere Krallığı</button>

                <button>⚜ Fransa Krallığı</button>

            </div>

            <br />

            <button onClick={() => navigate("/character")}>

                Devam →

            </button>

            <br /><br />

            <button onClick={() => navigate("/scenario")}>

                ← Senaryolar

            </button>

        </Layout>

    );

}

export default CountrySelect;