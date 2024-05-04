import React from "react";
import { useState } from 'react';
import PropTypes from "prop-types";
import { Card, Button, Col, Badge, Stack } from "react-bootstrap";
import { FaHeart, FaTrash } from "react-icons/fa";
import Modal from 'react-bootstrap/Modal';
import { Principal } from "@dfinity/principal";

const Comment = ({ drop_comment, }) => {

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const { id, comments} =
  drop_comment;

  // const triggerBuy = () => {
  //   buy(id);
  // };

  // const triggerDelete = () => {
  //   deleteShoe(id);
  // };
  // const triggerLike = () => {
  //   likeShoes(id);
  // };

  return (
    <Col key={id}>
      <Card className=" h-100">
        <Card.Header>
       HELLO
        </Card.Header>
        <Card.Body className="d-flex  flex-column text-center">
      

          <div> 
            <span className="text-uppercase fw-bold text-secondary">Comment: </span>
            <span>{comments}</span>
          </div>
   
 
        </Card.Body>
      </Card>
    </Col>
  );
};

Comment.propTypes = {
  drop_comment: PropTypes.instanceOf(Object).isRequired
};

export default Comment;
