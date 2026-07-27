import { Link } from 'react-router-dom'
import heroImg from '../../assets/hero.png'

function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Navegacao principal">
        <Link className="brand" to="/">
          Lili Transport
        </Link>
        <div className="nav-actions">
      
        </div>
      </nav>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="eyebrow">Mobilidade urbana inteligente</span>
          <h1>Viaja com mais controlo pela cidade.</h1>
          <p>
            Lili Transport liga passageiros, motoristas e administradores numa
            experiencia simples para gerir viagens, rotas e operacao diaria.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/login">
              Entrar
            </Link>
            <Link className="button button-secondary" to="/register">
              Criar conta
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="phone-frame">
            <div className="map-card">
              <div className="route-line"></div>
              <span className="route-point route-point-start"></span>
              <span className="route-point route-point-end"></span>
              <div className="ride-card">
                <strong>Lili Transport</strong>
                <span>Viagem activa</span>
              </div>
            </div>
          </div>
          <img src={heroImg} alt="" />
        </div>
      </section>
    </main>
  )
}

export default LandingPage
