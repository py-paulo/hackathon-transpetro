// components/Sidebar/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom'; // USE ISSO
import { useState, useEffect } from 'react';
import style from './style.module.scss';

// Ícones
import { MdArrowBackIosNew, MdOutlineDashboard, MdLogout } from 'react-icons/md';
import { FaShip, FaHistory, FaRegUserCircle, FaCalculator } from 'react-icons/fa';
import { FaMessage } from 'react-icons/fa6';

const logo = './public/transpetro.png';
const logoCollapsed = './public/transpetro-logo.png';

const SIDEBAR_WIDTH_EXPANDED = '16rem';
const SIDEBAR_WIDTH_COLLAPSED = '5rem';

const Sidebar = () => { // Removi props mode se não for usar agora
    
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation(); // Hook do react-router para saber onde estamos
    const [activeLink, setActiveLink] = useState('');
    
    // Atualiza o link ativo automaticamente baseado na URL
    useEffect(() => {
        setActiveLink(location.pathname);
    }, [location]);

    useEffect(() => {
        const targetWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;
        document.documentElement.style.setProperty('--dynamic-sidebar-width', targetWidth);
    }, [collapsed]);
  
    const handleExpandClick = () => {
      setCollapsed(!collapsed);
      // Evite manipular document.body diretamente em React se possível, 
      // mas para o hackathon pode manter se o SCSS depender disso
      document.body.classList.toggle(style.collapsed);
    };
  
    return (  
      <nav className={style.sidebar}>
        <div className={style.sidebarTopWrapper}>
          <div className={style.sidebarTop}>
            <Link to="/" className={style.logoWrapper} title="Início">
              {/* ATENÇÃO: Troquei Image do Next por img normal */}
              <img 
                src={collapsed ? logoCollapsed : logo} 
                alt="Logo Transpetro" 
                className={style.logoSmall} 
                style={{ width: collapsed ? '40px' : '120px', objectFit: 'contain' }}
              />
            </Link>
          </div>
          <button className={style.expandBtn} onClick={handleExpandClick}>
            <MdArrowBackIosNew />
          </button>
        </div>

        <hr className={style.hr} />

        {/* MENU PRINCIPAL */}
        <div className={style.sidebarLinks}>
          <h2>Gestão de Casco</h2>
          <ul>
            <li>
              <Link
                to="/" 
                className={`${style.tooltip} ${activeLink === '/' ? style.active : ''}`}
              >
                <MdOutlineDashboard />
                <span className={`${style.link} ${style.hide}`}>Dashboard Geral</span>
                <span className={style.tooltipContent}>Visão Geral</span>
              </Link>
            </li>

            <li>
              <Link
                to="/frota" 
                className={`${style.tooltip} ${activeLink === '/frota' ? style.active : ''}`}
              >
                <FaShip />
                <span className={`${style.link} ${style.hide}`}>Monitorar Frota</span>
                <span className={style.tooltipContent}>Frota</span>
              </Link>
            </li>

            <li>
                <Link 
                    to="/historico" 
                    className={`${style.tooltip} ${activeLink === '/historico' ? style.active : ''}`}
                >
                    <FaHistory />
                    <span className={`${style.link} ${style.hide}`}>Histórico & IWS</span>
                    <span className={style.tooltipContent}>Histórico</span>
                </Link>
            </li>
            <li>
                <Link 
                    to="/planejamento" 
                    className={`${style.tooltip} ${activeLink === '/planejamento' ? style.active : ''}`}
                >
                  <FaCalculator />
                  <span className={`${style.link} ${style.hide}`}>Planejamento & ROI</span>
                  <span className={style.tooltipContent}>Planejamento</span>
                </Link>
            </li>
            <li>
                <Link 
                    to="/chat" 
                    className={`${style.tooltip} ${activeLink === '/chat' ? style.active : ''}`}
                >
                  <FaMessage />
                  <span className={`${style.link} ${style.hide}`}>Assistente IA</span>
                  <span className={style.tooltipContent}>Chat</span>
                </Link>
            </li>
          </ul>  

            <div className={`${style.sidebarLinks} ${style.bottomLinks}`}>
              <hr className={style.hr} style={{ margin: '10px 0' }}/> 
              <ul>
                <li>
                  <Link 
                    to="/perfil" 
                    className={`${style.tooltip} ${activeLink === '/perfil' ? style.active : ''}`}
                  >
                    <FaRegUserCircle />
                    <span className={`${style.link} ${style.hide}`}>Perfil Engenheiro</span>
                    <span className={style.tooltipContent}>Perfil</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/login"
                    className={`${style.tooltip} ${activeLink === '/login' ? style.active : ''}`}
                  >
                    <MdLogout className={style.logout} />
                    <span className={`${style.link} ${style.hide} ${style.logout}`}>Sair</span>
                    <span className={style.tooltipContent}>Sair</span>
                  </Link>
                </li>
              </ul>
            </div>
        </div>
      </nav>
    );
}

export default Sidebar;