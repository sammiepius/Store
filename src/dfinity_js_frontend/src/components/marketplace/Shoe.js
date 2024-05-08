import React from "react";
import { useState } from 'react';
import PropTypes from "prop-types";
import { Card, Button, Col, Badge, Stack } from "react-bootstrap";
import { FaHeart, FaTrash } from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import { Principal } from "@dfinity/principal";
import {
  insertComment
} from "../../utils/marketplace";
import AddComment from "./AddComment";

const Shoe = ({ shoe, buy, deleteShoe, likeShoes }) => {

  const [show, setShow] = useState(false);
  const [show1, setShow1] = useState(false);

  const handleClose = () => setShow(false);
  const handleClose1 = () => setShow1(false);
  const handleShow = () => setShow(true);
  const handleShow1 = () => setShow1(true);

  const { id, price, name, description, location, shoeURL,like, size, seller, soldAmount, comments } =
    shoe;


    const addComment = async (shoeCommentId, comment) => {
      try {
          insertComment(shoeCommentId, comment).then
          ((resp) => {
              console.log({ resp });
          });
          window.location.reload();
          toast(<NotificationSuccess text="Comment added successfully." />);
      } catch (error) {
          console.log({ error });
          toast(<NotificationError text="Failed to create a Comment." />);
      } 
  };

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
          <Col>
            <AddComment addComment={addComment} shoeId={id} /> 
          </Col>
      <div variant="success" style={{ color:"blue", cursor:"pointer"}}  onClick={handleShow1}>
        <span>View comment</span>
      </div>
        <Modal show={show1} onHide={handleClose1} centered>
            <Modal.Header closeButton>
                <Modal.Title>Comments</Modal.Title>
            </Modal.Header>
                <Modal.Body>
                   <span>{comments}</span>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose1}>
                        Close
                    </Button>
                   
                </Modal.Footer>
        </Modal>

         
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
