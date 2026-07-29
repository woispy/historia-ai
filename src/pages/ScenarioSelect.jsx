import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function ScenarioSelect() {

    const navigate = useNavigate();

    return (

        <Layout title="Senaryo Seç">

            <div className="menu">

                <button onClick={() => navigate("/country")}>

                    🛡 1300 - Osmanlı Kuruluş Dönemi

                </button>

                <button disabled>

                    🔒 1453 - Yakında

                </button>

                <button disabled>

                    🔒 1789 - Yakında

                </button>

            </div>

            <br />

            <button onClick={() => navigate("/")}>

                ← Ana Menü

            </button>

        </Layout>

    );

}

export default ScenarioSelect;