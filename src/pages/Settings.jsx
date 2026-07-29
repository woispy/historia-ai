import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function Settings() {

    const navigate = useNavigate();

    return (

        <Layout title="Ayarlar">

            <p>Buraya oyun ayarları gelecek.</p>

            <button onClick={() => navigate("/")}>

                ← Ana Menü

            </button>

        </Layout>

    );

}

export default Settings;