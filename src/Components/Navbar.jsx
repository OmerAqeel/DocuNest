import React from 'react'
import { VscHubot } from 'react-icons/vsc'
import { Button } from "@/components/ui/button";
import "../Styles/Navbar.css";
import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
    const location = useLocation();
  return (
    <div className="header-container">
        <h1 className="header-title">
          <VscHubot size={35}/> DocuNest
        </h1>
        {(location.pathname === "/signup" ?
        <Link to="/signin">
          <Button className="signIn-btn">Sign In</Button>
        </Link>
        : location.pathname === "/signin" ?
        <Link to="/signup">
          <Button className="signIn-btn">Sign Up</Button>
        </Link>
        : null)}
      </div>
  )
}
