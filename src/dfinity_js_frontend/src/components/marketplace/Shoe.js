import React from "react";
import { useState } from 'react';
import PropTypes from "prop-types";
import { Card, Button, Col, Badge, Stack } from "react-bootstrap";
import { FaHeart, FaTrash } from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import { Principal } from "@dfinity/principal";

const Shoe = ({ shoe, buy, deleteShoe, likeShoes }) => {

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const { id, price, name, description, location, shoeURL,like, size, seller, soldAmount } =
    shoe;

  const triggerBuy = () => {
    buy(id);
  };

  const triggerDelete = () => {
    deleteShoe(id);
  };
  const triggerLike = () => {
    likeShoes(id);
  };

  return (
    <Col key={id}>
      <Card className=" h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <FaTrash onClick={triggerDelete} style={{color: "red", cursor:"pointer",fontSize:"22px"}}/>
            <Badge bg="secondary" className="ms-auto">
              {soldAmount.toString()} Sold
            </Badge>
          </Stack>
        </Card.Header>
        <div className=" ratio ratio-4x3">
          <img src={shoeURL} alt={name} style={{ objectFit: "cover" }} />
        </div>
        <Card.Body className="d-flex  flex-column text-center">
  
  <div style={{ display:'flex',alignItems: "left" }}>
    <FaHeart style={{ color: "red", cursor: "pointer", fontSize: '20px' }} onClick={triggerLike}/>
    <span style={{ fontWeight: "bold" }}>{like}</span>
  </div>
      <Button variant="success" onClick={handleShow}>
        View shoe details
      </Button>
      
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div className=" ratio ratio-4x3">
          <img src={shoeURL} alt={name} style={{ objectFit: "cover" }} />
        </div>
        <Card.Title>{name}</Card.Title>
          
            <div className="text-uppercase fw-bold text-secondary text-sm">Description: </div>
            <span>{description}</span>
           
          <div> 
            <span className="text-uppercase fw-bold text-secondary">Size: </span>
            <span>{size}</span>
          </div>
    
          <div>  
             <div className="text-uppercase fw-bold text-secondary">Location: </div>
          <span>{location} </span> 
          </div>
          <Card.Text className="text-secondary">
            <span>{Principal.from(seller).toText()}</span>
          </Card.Text>
         
        </Modal.Body>
        <Modal.Footer>
         
          <Button
            variant="outline-dark"
            onClick={triggerBuy}
            className="w-100 py-3"
          >
            Buy for {(price / BigInt(10**8)).toString()} ICP
          </Button>
        </Modal.Footer>
      </Modal>
 
        </Card.Body>
      </Card>
    </Col>
  );
};

Shoe.propTypes = {
  shoe: PropTypes.instanceOf(Object).isRequired,
  buy: PropTypes.func.isRequired,
};

export default Shoe;
