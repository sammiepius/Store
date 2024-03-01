import React from "react";
import PropTypes from "prop-types";
import { Card, Button, Col, Badge, Stack } from "react-bootstrap";
import { Principal } from "@dfinity/principal";

const Shoe = ({ shoe, buy }) => {
  const { id, price, name, description, location, shoeURL, size, seller, soldAmount } =
    shoe;

  const triggerBuy = () => {
    buy(id);
  };

  return (
    <Col key={id}>
      <Card className=" h-100">
        <Card.Header>
          <Stack direction="horizontal" gap={2}>
            <span className="font-monospace text-secondary">{Principal.from(seller).toText()}</span>
            <Badge bg="secondary" className="ms-auto">
              {soldAmount.toString()} Sold
            </Badge>
          </Stack>
        </Card.Header>
        <div className=" ratio ratio-4x3">
          <img src={shoeURL} alt={name} style={{ objectFit: "cover" }} />
        </div>
        <Card.Body className="d-flex  flex-column text-center">
          <Card.Title>{name}</Card.Title>
          <Card.Text className="flex-grow-1 ">{description}</Card.Text>
          <Card.Text className="flex-grow-1 ">{size}</Card.Text>
          <Card.Text className="text-secondary">
            <span>{location}</span>
          </Card.Text>
          <Card.Text className="text-secondary">
            <span>{Principal.from(seller).toText()}</span>
          </Card.Text>
          <Button
            variant="outline-dark"
            onClick={triggerBuy}
            className="w-100 py-3"
          >
            Buy for {(price / BigInt(10**8)).toString()} ICP
          </Button>
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
