import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AddShoe from "./AddShoe";
import Shoe from "./Shoe";
import Loader from "../utils/Loader";
import { Row } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import styled from 'styled-components';

import { NotificationSuccess, NotificationError } from "../utils/Notifications";
import {
  getShoes as getShoeList,
  createShoe, buyShoe, deleteShoeById
} from "../../utils/marketplace";


const Language = styled.span`
  font-size: 14px;
  cursor: pointer;
  
`;
const SearchContainer = styled.div`
  border: 0.5px solid lightgray;
  display: flex;
  align-items: center;
  margin-left: 25px;
  padding: 5px;
`;

const Left = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  `;

  const Input = styled.input`
  border: none;
  
`;

const Shoes = () => {
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // const urlParams = new URLSearchParams(window.location.search);

  // function to get the list of shoe
  const getShoes = useCallback(async () => {
    try {
      setLoading(true);
      setShoes(await getShoeList());
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  });


  const deleteShoe = async (id) => {
    try {
      setLoading(true);
      // toast.success("please wait your request is been processed")
      toast(<NotificationSuccess text="please wait your request is been processed." />);
      deleteShoeById(id).then((resp) => {
        toast(<NotificationSuccess text="Shoe deleted successfully." />);
        getShoes();
      });
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  };

  const addShoe = async (data) => {
    try {
      setLoading(true);
      const priceStr = data.price;
      data.price = parseInt(priceStr, 10) * 10**8;
      createShoe(data).then((resp) => {
        getShoes();
      });
      toast(<NotificationSuccess text="Shoe added successfully." />);
    } catch (error) {
      console.log({ error });
      toast(<NotificationError text="Failed to create a shoe." />);
    } finally {
      setLoading(false);
    }
  };

  // const searchShoes = async () => {
    
  //   const searched = search.toLowerCase();
  //   try {
  //     let filtered = shoes.filter(
  //       (shoe) =>
  //         (shoe.name.toLowerCase().includes(searched))
        
          
  //     );
  //     setShoes(filtered);
  //   } catch (error) {
  //     console.log({ error });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //  function to initiate transaction
  const buy = async (id) => {
    try {
      setLoading(true);
      await buyShoe({
        id
      }).then((resp) => {
        getShoes();
        toast(<NotificationSuccess text="shoe bought successfully" />);
      });
    } catch (error) {
      toast(<NotificationError text="Failed to purchase shoe." />);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    getShoes();
  }, []);

const handleChange = (e) => {
 const searchTerm = e.target.value;
   setSearch(searchTerm);
     if (searchTerm === "") {
        return getShoes();
   }

  const filtered = shoes.filter(
   (shoe) =>
        (shoe.name.toLowerCase().includes(searchTerm.toLowerCase()))  
  );
    setShoes(filtered);
  };
  
  return (
    <>
      {!loading ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
              <Left>
          <Language>EN</Language>
          <SearchContainer>
            <Input 
            placeholder="search"  
            value={search}
            onChange={handleChange}
            />
            <FaSearch  
            style={{ color: 'grey', fontSize: 25}} 
              />
          </SearchContainer>
        </Left>
            <AddShoe save={addShoe} />
          </div>
          <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xxl-5">
            {shoes.map((_shoe) => (
              <Shoe
                shoe={{
                  ..._shoe,
                }}
                buy={buy}
                deleteShoe={deleteShoe}
              />
            ))}
          </Row>
        </>
      ) : (
        <Loader />
      )}
    </>
  );
};

export default Shoes;
