import React, { LiHTMLAttributes } from "react";

interface UlProps extends LiHTMLAttributes<HTMLLIElement> {
  ulName: string;
  items: string[];
}

const Ul = ({ ulName, items, ...rest }: UlProps) => {
  return (
    <>
      <p>{ulName}</p>
      <ul className="lib-nav-section admin">
        {items.map((name, idx) => {
          return (
            <li key={name + idx} {...rest}>
              {name}
            </li>
          );
        })}
      </ul>
    </>
  );
};

export default Ul;
