import { watch, markRaw } from "vue";
import { useMainStore } from "./MainStore";
import { useElementStore } from "./ElementStore";
export const fetchMeta = () => {
	const MainStore = useMainStore();
	frappe.model.clear_doc("Print Format", MainStore.printDesignName);
	frappe.model.with_doc("Print Format", MainStore.printDesignName, () => {
		let print_format = frappe.get_doc("Print Format", MainStore.printDesignName);
		MainStore.doctype = print_format.doc_type;
		frappe.model.with_doctype(print_format.doc_type, () => {
			MainStore.rawMeta = markRaw(frappe.get_meta(print_format.doc_type));
			let metaFields = frappe.get_meta(print_format.doc_type).fields.filter((df) => {
				if (
					["Section Break", "Column Break", "Tab Break", "Image"].includes(df.fieldtype) ||
					(df.print_hide == 1 && df.fieldtype != "Link")
				) {
					return false;
				} else {
					return true;
				}
			});
			metaFields.map((field) => {
				if (field["print_hide"] && field["fieldtype"] != "Link") return;
				let obj = {};
				["fieldname", "fieldtype", "label", "options"].forEach((attr) => {
					obj[attr] = field[attr];
				});
				MainStore.metaFields.push({ ...obj });
			});
			metaFields.map((field) => {
				if (field["fieldtype"] != "Table" || field["print_hide"]) return;
				getMeta(field.options, field.fieldname);
			});
			fetchDoc();
			!MainStore.getTableMetaFields.length && (MainStore.controls.Table.isDisabled = true);
		});
	});
	return;
};

export const getMeta = async (doctype, parentField) => {
	const MainStore = useMainStore();
	const parentMetaField = MainStore.metaFields.find((o) => o.fieldname == parentField);
	if (MainStore.metaFields.find((o) => o.fieldname == parentField)["childfields"]) {
		return MainStore.metaFields[parentField]["childfields"];
	}
	let result;
	const exculdeFields = ["Section Break", "Column Break", "Tab Break", "HTML"];
	if (parentMetaField.fieldtype != "Table") {
		// Remove Link Field
		exculdeFields.push("Link");
	}
	await frappe.model.with_doctype(doctype, async () => {
		result = await frappe.get_meta(doctype);
	});
	let childfields = result.fields.filter((df) => {
		if (
			exculdeFields.includes(df.fieldtype) ||
			(parentMetaField.fieldtype != "Table" && df.print_hide == 1)
		) {
			return false;
		} else {
			return true;
		}
	});

	let fields = [];
	childfields.map((field) => {
		let obj = {};
		["fieldname", "fieldtype", "label", "options", "print_hide"].forEach((attr) => {
			obj[attr] = field[attr];
		});
		fields.push({ ...obj });
	});
	childfields.sort((a, b) => a.print_hide - b.print_hide);
	parentMetaField["childfields"] = fields;
	return fields;
};
export const getValue = async (doctype, name, fieldname) => {
	const result = await frappe.db.get_value(doctype, name, fieldname);

	const value = await result.message[fieldname];
	return value;
};

export const fetchDoc = async (id = null) => {
	const MainStore = useMainStore();
	const ElementStore = useElementStore();
	let doctype = MainStore.doctype;
	let doc;
	await ElementStore.loadElements(MainStore.printDesignName);
	if (MainStore.currentDoc == null) {
		if (!id) {
			let latestdoc = await frappe.db.get_list(doctype, {
				fields: ["name"],
				order_by: "modified desc",
				limit: 1,
			});
			MainStore.currentDoc = latestdoc[0]?.name;
		} else {
			MainStore.currentDoc = id;
		}
	}
	watch(
		() => MainStore.currentDoc,
		async () => {
			if (!(MainStore.currentDoc && await frappe.db.exists(MainStore.doctype, MainStore.currentDoc))) return;
			doc = await frappe.db.get_doc(doctype, MainStore.currentDoc);
			Object.keys(doc).forEach((element) => {
				if (
					!MainStore.metaFields.find((o) => o.fieldname == element) &&
					["name"].indexOf(element) == -1
				) {
					delete doc[element];
				}
			});
			MainStore.docData = doc;
			await frappe.dom.freeze();
			MainStore.dynamicData.forEach(async (el) => {
				if (el.is_static) return;
				let value = el.parentField
					? await getValue(el.doctype, MainStore.docData[el.parentField], el.fieldname)
					: el.tableName
					? frappe.format(
							MainStore.docData[el.tableName][0][el.fieldname],
							{ fieldtype: el.fieldtype, options: el.options },
							{ inline: true },
							MainStore.docData
					  )
					: frappe.format(
							MainStore.docData[el.fieldname],
							{ fieldtype: el.fieldtype, options: el.options },
							{ inline: true },
							MainStore.docData
					  );
				if (typeof value == "string" && value.startsWith("<svg")) {
					value.match(new RegExp(`data-barcode-value="(.*?)">`));
					value = result[1];
				};
				if (!value) {
					if (["Image, Attach Image"].indexOf(el.fieldtype) != -1) {
						value = null;
					} else {
						switch (el.fieldname) {
							case "page":
								value = "0";
								break;
							case "topage":
								value = "999";
								break;
							case "date":
								value = frappe.datetime.now_date();
								break;
							case "time":
								value = frappe.datetime.now_time();
								break;
							default:
								value = `{{ ${el.parentField ? el.parentField + "." : ""}${
									el.fieldname
								} }}`;
						}
					}
				}
				el.value = value;
			});
			await frappe.dom.unfreeze();
		},
		{ immediate: true }
	);
};
