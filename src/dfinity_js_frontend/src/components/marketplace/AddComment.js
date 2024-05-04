import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";

const AddComment = ({ save }) => {
  const [comments, setComments] = useState("");

  const isFormFilled = () => comments

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  
  return (
    <>
      <Button
        onClick={handleShow}
        variant="dark"
        className="rounded-pill px-0"
        style={{ width: "38px" }}
      >
        <i class="bi bi-plus"></i>
      </Button>
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Comments</Modal.Title>
        </Modal.Header>
        <Form>
          <Modal.Body>
            <FloatingLabel
              controlId="inputComment"
              label="Comment"
              className="mb-3"
            >
              <Form.Control
                as="textarea"
                placeholder="comment"
                style={{ height: "80px" }}
                onChange={(e) => {
                  setComments(e.target.value);
                }}
              />
            </FloatingLabel>
          </Modal.Body>
        </Form>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Close
          </Button>
          <Button
            variant="dark"
            disabled={!isFormFilled()}
            onClick={() => {
              save({
                comments,
              });
              handleClose();
            }}
          >
           comment
          </Button>

          {/* <span>{comments}</span> */}
        </Modal.Footer>
      </Modal>
    </>
  );
};

AddComment.propTypes = {
  save: PropTypes.func.isRequired,
};

export default AddComment;
