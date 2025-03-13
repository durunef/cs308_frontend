import { Link } from "react-router-dom";

function App() {
  return (
    <div className="name-container">
      <h1>Duru</h1>
      <h1>Serhat</h1>
      <h1>Ömer</h1>
      <h1>Arda</h1>
      <h1>Deren</h1>
      
      <div style={{ marginTop: "20px" }}>
        <Link to="/login" style={{ marginRight: "15px", fontSize: "20px", color: "blue" }}>
          Login
        </Link>
        <Link to="/register" style={{ fontSize: "20px", color: "green" }}>
          Register
        </Link>
      </div>
    </div>
  );
}

export default App;
