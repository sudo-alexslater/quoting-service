import { data, divNoNan, sub, Tensor, tensor1d, tensor2d, tidy } from "@tensorflow/tfjs-node";

enum Furnishing {
	Unfurnished,
	PartFurnished,
	Furnished,
}
export function getFurnishing(furnishing: string): number {
	switch (furnishing.toLowerCase()) {
		case "unfurnished":
			return 0;
		case "semi-furnished":
			return 1;
		case "furnished":
			return 2;
		default:
			throw new Error("Invalid furnishing type");
	}
}

export function getYesNo(yesNo: string): number {
	switch (yesNo.toLowerCase()) {
		case "yes":
			return 1;
		case "no":
			return 0;
		default:
			throw new Error("Invalid YesNo type");
	}
}

const calculateQuote = (quote: number[]): number => {
	const [numberOfWindows, accessToGarden] = quote;
	return numberOfWindows * 5 + (accessToGarden ? 0 : 1) * 10;
};

export function getQuoteTestData(size: number) {
	const inputs: number[][] = [];
	const outputs: number[] = [];
	for (let i = 0; i < size; i++) {
		const numberOfWindows = Math.floor(Math.random() * 10) + 1;
		const accessToGarden = Math.random() > 0.5 ? 1 : 0;
		inputs.push([numberOfWindows, accessToGarden]);
		const quote = calculateQuote([numberOfWindows, accessToGarden]);
		outputs.push(quote);
	}

	const input_tensors = normalizeData(tensor2d(inputs));
	const output_tensors = normalizeData(tensor1d(outputs));
	return { input_tensors, output_tensors };
}

export async function getRealQuoteTestData(limit?: number) {
	const csv = data.csv(`file://${__dirname}/data/Housing.csv`, {
		columnConfigs: { price: { isLabel: true } },
	});
	let csvAsArray = await csv.toArray();
	if (limit) {
		csvAsArray = csvAsArray.slice(0, limit);
	}
	const results = csvAsArray.map((row: any) => {
		const parsedRow = {
			xs: [
				parseInt(row.xs.area),
				parseInt(row.xs.bedrooms),
				parseInt(row.xs.bathrooms),
				parseInt(row.xs.stories),
				getYesNo(row.xs.mainroad),
				getYesNo(row.xs.guestroom),
				getYesNo(row.xs.basement),
				getYesNo(row.xs.hotwaterheating),
				getYesNo(row.xs.airconditioning),
				parseInt(row.xs.parking),
				getYesNo(row.xs.prefarea),
				getFurnishing(row.xs.furnishingstatus),
			],
			ys: row.ys.price,
		};
		console.log(parsedRow);
		return parsedRow;
	});
	console.log(`results include ${results[0].xs.length} inputs and 1 outputs`);

	const input_tensors = normalizeData(tensor2d(results.map((r) => r.xs)));
	const output_tensors = normalizeData(tensor1d(results.map((r) => r.ys)));
	console.log(`input_tensors: ${input_tensors.normalized.toString()}}`);
	console.log(`output_tensors: ${output_tensors.normalized.toString()}}`);

	return { input_tensors, output_tensors };
}

export function normalizeData(tensor: Tensor) {
	const result = tidy(function () {
		const max = tensor.max(0);
		const min = tensor.min(0);
		const subtract_tensor = sub(tensor, min);
		const range = sub(max, min);
		return { normalized: divNoNan(subtract_tensor, range), max, min };
	});
	return result;
}
