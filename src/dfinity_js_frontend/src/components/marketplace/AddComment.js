import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button, Modal, Form, FloatingLabel } from "react-bootstrap";

const AddComment = ({addComment, shoeId}) => {
    const [comment, setComment] = useState("");
    const id = shoeId;
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
  return (
    <>
        <Button onClick={handleShow} variant="dark" >
            Add Comment
        </Button>
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>New Comment</Modal.Title>
            </Modal.Header>
            <Form>
                <Modal.Body>
                    <FloatingLabel controlId="inputComment" label="Comment" className="mb-3">
                        <Form.Control as="textarea" 
                        type="text" 
                        onChange={(e) => {
                            setComment(e.target.value);
                        }} 
                        placeholder="Enter comment" 
                        />
                    </FloatingLabel>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => {
                        addComment(id, comment);
                        handleClose();
                    }}>
                        Save
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    </>
  )
}

AddComment.propTypes = {
    addComment: PropTypes.func.isRequired,
    shoeId: PropTypes.string.isRequired
}
export default AddComment