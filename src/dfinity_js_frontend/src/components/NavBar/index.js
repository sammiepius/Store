import React, { useEffect, useCallback, useState } from "react";
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavItem,
} from 'reactstrap';
import Wallet from ".././Wallet";
import { login, logout as destroy } from "../../utils/auth";
import { balance as principalBalance } from "../../utils/ledger"



 function ShoeNav(args) {
    const principal = window.auth.principalText;
    const isAuthenticated = window.auth.isAuthenticated;
    const [balance, setBalance] = useState("0");
   

    const getBalance = useCallback(async () => {
        if (isAuthenticated) {
            setBalance(await principalBalance());
        }
    });


    useEffect(() => {
        getBalance();
    }, [getBalance]);

    return (
        <>
        <Navbar expand="md" className="shadow">
          <NavbarBrand style={{ fontWeight: 'bold', color: 'rgb(38, 69, 100)' }}>
            SHOESTORE
          </NavbarBrand>
          <Nav navbar>
            <NavItem>
            <Wallet
              principal={principal}
              balance={balance}
              symbol={"ICP"}
              isAuthenticated={isAuthenticated}
              destroy={destroy}
              />
            </NavItem>
          </Nav>
        </Navbar>
      </>
    );
};

export default ShoeNav;