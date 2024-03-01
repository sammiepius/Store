import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import AddShoe from "./AddShoe";
import Shoe from "./Shoe";
import Loader from "../utils/Loader";
import { Row } from "react-bootstrap";

import { NotificationSuccess, NotificationError } from "../utils/Notifications";
import {
  getShoes as getShoeList,
  createShoe, buyShoe
} from "../../utils/marketplace";

const Shoes = () => {
  const [shoes, setShoes] = useState([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      {!loading ? (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="fs-4 fw-bold mb-0">Shoes</h1>
            <AddShoe save={addShoe} />
          </div>
          <Row xs={1} sm={2} lg={3} className="g-3  mb-5 g-xl-4 g-xxl-5">
            {shoes.map((_shoe) => (
              <Shoe
                shoe={{
                  ..._shoe,
                }}
                buy={buy}
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
