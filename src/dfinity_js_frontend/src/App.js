import React, { useEffect, useCallback, useState } from "react";
import Shoes from "./components/marketplace/Shoes";
import "./App.css";
import coverImg from "./assets/img/sandwich.jpg";
import { login, logout as destroy } from "./utils/auth";
import Cover from "./components/utils/Cover";
import { Notification } from "./components/utils/Notifications";
import ShoeNav from "./components/NavBar";
import { Container } from "react-bootstrap";


const App = function AppWrapper() {
    const isAuthenticated = window.auth.isAuthenticated;

    return (
        <>
            <Notification />
            {isAuthenticated ? (
                <div>
                    <ShoeNav />
                    <br />
                    <main>
                        <Shoes />
                    </main>
                </div>
            ) : (
                <Cover name="Street Food" login={login} coverImg={coverImg} />
            )}
        </>
    );
};

export default App;