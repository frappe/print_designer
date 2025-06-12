#set page(
  width: 210mm,
  height: 297mm,
  margin: (top: 30mm, bottom: 30mm, left: 10mm, right: 10mm),
  background: image("frappeneering.svg", width: 210mm, height: 297mm),
)

#let label(body) = text(
  font: "Helvetica",
  size: 10pt,
  weight: 600,
  fill: rgb("#555"),
  [#body],
)

#let value(body) = text(
  font: "Helvetica",
  size: 12pt,
  weight: 400,
  fill: rgb("#000"),
  [#body],
)

#let staticText(body) = {
  set align(left)
  block(
    inset: 0.00pt,
    par(
      leading: 1.25pt,
      text(
        font: ("Inter 18pt", "Arial", "Helvetica"),
        size: 12.00pt,
        weight: "regular",
        tracking: 0.00pt,
        [#body],
      ),
    ),
  )
}

#let dynamicText(body) = {
  set align(left)
  block(
    inset: 0.00pt,
    par(
      leading: 1.25pt,
      text(
        font: ("Inter 18pt", "Arial", "Helvetica"),
        size: 12.00pt,
        weight: "regular",
        tracking: 0.00pt,
        [#body],
      ),
    ),
  )
}

#text(font: "Inter 18pt", size: 14pt, weight: 700, fill: rgb("#000"), "Sales Invoice")

#dynamicText("ACC-SINV-2025-00001")

#line(length: 100%, stroke: (paint: rgb("#000"), thickness: 0.1pt))

#place(
  dx: 0mm,
  dy: 1mm,
  block(
    width: 190mm,
    height: 20mm,
    staticText("Customer Name:"),
  ),
)
