#set page(width: 210mm, height: 297mm, margin: (top: 30mm, bottom: 30mm, left: 10mm, right: 10mm), background: image(
  "letterhead.svg",
  width: 210mm,
  height: 297mm,
))

#let label(body) = text(font: "Helvetica", size: 10pt, weight: 600, fill: rgb("#555"), [#body])

#let value(body) = text(font: "Helvetica", size: 12pt, weight: 400, fill: rgb("#000"), [#body])

#let staticText(body) = {
  set align(left)
  block(inset: 0.00pt, par(leading: 0.50em, text(
    font: ("Inter 18pt", "Arial", "Helvetica"),
    size: 12.00pt,
    weight: "bold",
    tracking: 0.00pt,
    [#body],
  )))
}

#let dynamicText(body) = {
  set align(left)
  block(inset: 0.00pt, par(leading: 0.50em, text(
    font: ("Inter 18pt", "Arial", "Helvetica"),
    size: 12.00pt,
    weight: "regular",
    tracking: 0.00pt,
    [#body],
  )))
}

#text(font: "Inter 18pt", size: 14pt, weight: 700, fill: rgb("#000"), "Sales Invoice")

#dynamicText("ACC-SINV-2025-00001")

#line(length: 100%, stroke: (paint: rgb("#000"), thickness: 0.1pt))

#place(dx: 0mm, dy: 5mm, block(width: 190mm, height: 20mm, text(weight: "bold")[#staticText("Customer Name")]))

#place(dx: 0mm, dy: 12mm, block(width: 190mm, height: 20mm, dynamicText("Customer Address\nCity, State, ZIP\nCountry")))

#place(dx: 80mm, dy: 5mm, block(width: 80mm, height: 20mm, staticText("Invoice Date:")))
#place(dx: 80mm, dy: 12mm, block(width: 80mm, height: 20mm, dynamicText("01-06-2025")))


#place(dx: 80mm, dy: 25.00mm, block(width: 190mm, height: 20mm, staticText("Status:")))
#place(dx: 80mm, dy: 31.00mm, block(width: 80mm, height: 20mm, dynamicText("Unpaid")))



#place(dx: 150mm, dy: 5mm, block(width: 40mm, height: 20mm, staticText("Due Date:")))
#place(dx: 150mm, dy: 12mm, block(width: 80mm, height: 20mm, dynamicText("01-07-2025")))


#place(dx: 0mm, dy: 45mm, block(
  width: 190mm,
  // height: 20mm,
)[
  #table(
    columns: (auto, auto, 3fr, auto, auto, auto),
    fill: (_, y) => if y == 0 { rgb("#dddddd") },
    table.header([No], [Code], [Description], [Quantity], [Rate], [Amount]),
    [1], [STO-00001], [The item Description], [2.00], [\$ 40.00], [\$ 80.00],
    [2], [STO-00002], [Another item Description], [1.00], [\$ 60.00], [\$ 60.00],
    [3], [STO-00003], [Yet another item Description], [3.00], [\$ 20.00], [\$ 60.00],
  )
])

#place(dx: 140mm, dy: 75mm, block(width: 190mm, height: 20mm, staticText("Subtotal:")))
#place(dx: 170mm, dy: 75mm, block(width: 80mm, height: 20mm, dynamicText("$ 200.00")))
#place(dx: 140mm, dy: 85mm, block(width: 190mm, height: 20mm, staticText("Tax (10%):")))
#place(dx: 170mm, dy: 85mm, block(width: 80mm, height: 20mm, dynamicText("$ 20.00")))
#place(dx: 140mm, dy: 95mm, block(width: 190mm, height: 20mm, staticText("Total:")))
#place(dx: 170mm, dy: 95mm, block(width: 80mm, height: 20mm, dynamicText("$ 220.00")))
