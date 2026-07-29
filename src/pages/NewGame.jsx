import { useNavigate } from "react-router-dom";

function NewGame() {

    const navigate = useNavigate();

    return (

        <div className="app">

            <h1>Yeni Oyun</h1>

            <p>İlk senaryo burada seçilecek.</p>

            <button onClick={() => navigate("/")}>

                ← Ana Menü

            </button>

        </div>

    );

}

export default NewGame;