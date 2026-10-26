export function buildWhatsAppUrl(phone, message) {
  const digits = String(phone).replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(digits))
    throw new Error("Número de WhatsApp inválido.");
  return `https://wa.me/${digits}?text=${encodeURIComponent(String(message).trim())}`;
}

export function buildOrderMessage({ name, idea, quantity, deadline }) {
  const cleanName = String(name ?? "").trim();
  const cleanIdea = String(idea ?? "").trim();
  const cleanQuantity = String(quantity ?? "").trim();
  if (!cleanName || !cleanIdea)
    throw new Error("Preencha seu nome e conte sua ideia.");
  if (
    !/^\d+$/.test(cleanQuantity) ||
    Number(cleanQuantity) < 1 ||
    Number(cleanQuantity) > 10000
  ) {
    throw new Error("Informe uma quantidade entre 1 e 10.000 peças.");
  }
  return [
    "Olá, Cultura 3D! Quero dar forma a uma ideia.",
    "",
    `Meu nome: ${cleanName}`,
    `Minha ideia: ${cleanIdea}`,
    `Quantidade estimada: ${cleanQuantity}`,
    ...(String(deadline ?? "").trim()
      ? [`Para quando: ${String(deadline).trim()}`]
      : []),
    "",
    "Posso enviar imagens de referência por aqui.",
  ].join("\n");
}
