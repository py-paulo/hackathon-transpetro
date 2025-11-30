import style from "./style.module.scss";
import { useState, useEffect } from "react";
import profile from "../../../public/profile.png";
import { MdDarkMode, MdLightMode } from "react-icons/md";

const Navbar = () => {

  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('theme') ?? 'light';
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <nav className={style.navbar}>
      <div className={style.content}>
        <div className={style.darkMode}>
          <button className={style.button} onClick={toggleTheme} >
            {theme === 'light' ?
              <MdLightMode className={style.icon} /> :
              <MdDarkMode className={style.iconActive} /> }
          </button>
        </div>
        <div className={style.sidebarProfile}>
          <div className={style.avatarWrapper}>
            <img className={style.avatar} src={profile} alt="Joe Doe Picture" width={40} height={40} />
          </div>
          <section className={`${style.avatarName} ${style.hide}`}>
            <div className={style.userName}>Joe Doe</div>
            <div className={style.email}>joe.doe@atheros.ai</div>
          </section>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;