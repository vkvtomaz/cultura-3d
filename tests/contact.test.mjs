import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppUrl, buildOrderMessage } from "../src/contact.js";

test("preserva acentos e caracteres especiais sem criar parâmetros extras", () => {
  const message =
    "Olá! João & Ana querem #arte 100% nossa.\nReferência: a+b?x=1&y=2";
  const url = new URL(buildWhatsAppUrl("+55 (11) 98833-2882", message));
  assert.equal(url.pathname, "/5511988332882");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal([...url.searchParams].length, 1);
  assert.equal(url.hash, "");
});
test("monta uma encomenda sem inventar prazo opcional", () => {
  const message = buildOrderMessage({
    name: " Ana ",
    idea: "Chaveiros para minha coleção",
    quantity: "12",
  });
  assert.match(message, /Meu nome: Ana/);
  assert.match(message, /Quantidade estimada: 12/);
  assert.ok(!message.includes("Para quando:"));
});
test("inclui o prazo quando informado", () => {
  assert.match(
    buildOrderMessage({
      name: "Ana",
      idea: "Objeto autoral",
      quantity: "1",
      deadline: "Em dezembro",
    }),
    /Para quando: Em dezembro/,
  );
});
test("rejeita quantidades inválidas e campos obrigatórios vazios", () => {
  for (const quantity of ["0", "-1", "1.5", "1e2", "10001", ""])
    assert.throws(() =>
      buildOrderMessage({ name: "Ana", idea: "Uma peça", quantity }),
    );
  assert.throws(() =>
    buildOrderMessage({ name: " ", idea: "Peça", quantity: "1" }),
  );
  assert.throws(() =>
    buildOrderMessage({ name: "Ana", idea: "", quantity: "1" }),
  );
});
test("rejeita número de contato inválido", () => {
  assert.throws(() => buildWhatsAppUrl("não informado", "Olá"));
});
