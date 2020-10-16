import { parse } from './parser';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { createTextChangeRange } from 'typescript';

export default function App() {
  const [expression, setExpression] = useState("");
  
  const add = useCallback((sign: string) => () => setExpression(expr => expr + sign), []);
  const remove = useCallback(() => setExpression(exp => exp.trim().slice(0, -1)), []);
  const clear = useCallback(() => setExpression(""), []);

  useBinding("1", add("1"));
  useBinding("2", add("2"));
  useBinding("3", add("3"));
  useBinding("4", add("4"));
  useBinding("5", add("5"));
  useBinding("6", add("6"));
  useBinding("7", add("7"));
  useBinding("8", add("8"));
  useBinding("9", add("9"));

  useBinding("+", add(" + "));
  useBinding("-", add(" - "));
  useBinding("*", add(" * "));
  useBinding("/", add(" / "));

  useBinding("(", add(" ( "));
  useBinding(")", add(" ) "));

  useBinding("Backspace", remove);

  
  let { error, result } = useMemo(() => {
    if(!expression)
      return {};

    try {
      const tree = parse(expression);
      console.log("parsed", tree);
      return { result: tree.evaluate() };
    } catch(error) {
      return { error: error.message };
    }
  }, [expression]);
  return (
    <div className="App">
      <h1>Calculator</h1>
      <div className="expression">
        {expression} |
      </div>
      {error && <div className="error">{error}</div>}
      {result && <div className="result">
        {Math.abs(result) >= Number.MAX_SAFE_INTEGER 
          ? (Math.abs(result) >= Number.MAX_VALUE ? "that's too huge?" : `~ ${result}`) 
          : `= ${result}`}
      </div>}
      <div className="btns">
        <div className="btn" onClick={add("1")}>1</div>
        <div className="btn" onClick={add("2")}>2</div>
        <div className="btn" onClick={add("3")}>3</div>
        <div className="btn btn__control" onClick={add(" + ")}>+</div>

        <div className="btn" onClick={add("4")}>4</div>
        <div className="btn" onClick={add("5")}>5</div>
        <div className="btn" onClick={add("6")}>6</div>
        <div className="btn btn__control" onClick={add(" - ")}>-</div>

        <div className="btn" onClick={add("7")}>7</div>
        <div className="btn" onClick={add("8")}>8</div>
        <div className="btn" onClick={add("9")}>9</div>
        <div className="btn btn__control" onClick={add(" * ")}>*</div>

        <div className="btn btn__control" onClick={clear}>C</div>
        <div className="btn" onClick={add("0")}>0</div>
        <div className="btn btn__control" onClick={remove}>{"<"}</div>
        <div className="btn btn__control" onClick={add(" / ")}>/</div>

        <div className="btn btn__control" onClick={add(" ( ")}>(</div>
        <div className="btn btn__control" onClick={add(" ) ")}>)</div>
        <div className="btn btn__control" onClick={add(" log ")}>log</div>
        <div className="btn btn__control" onClick={add(" exp ")}>exp</div>
      </div>
    </div>
  );
}

function useBinding(key: KeyboardEvent["key"], cb: () => void) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      console.log(event.key);
      if(event.key === key) cb();
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
