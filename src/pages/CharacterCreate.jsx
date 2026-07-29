import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

function CharacterCreate() {

    const navigate = useNavigate();

    return (

        <Layout title="Karakter Oluştur">

            <p>

                Burada hükümdarın özelliklerini belirleyeceğiz.

            </p>

            <button onClick={() => navigate("/game")}>

                Oyunu Başlat

            </button>

            <br /><br />

            <button onClick={() => navigate("/country")}>

                ← Ülke Seç

            </button>

        </Layout>

    );

}

export default CharacterCreate;