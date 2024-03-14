import React from "react";

interface BookCardProps {
  id: number;
  name: string;
  copies: number;
}

const BookCard = ({ id, name, copies }: BookCardProps) => {
  return (
    <div className="lib-book-card">
      <p>№: {id}</p>
      <p>{name}</p>
      <p>Available copies: {copies}</p>
    </div>
  );
};

export default BookCard;
