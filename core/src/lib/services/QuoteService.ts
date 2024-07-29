import { DynamoProvider, generateResourceId } from "@alexslater-io/common";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { Quote } from "../types/Quote";

export class QuoteService {
	constructor(private dbClient = DynamoProvider.instance) {}

	public create(): Quote {
		return {
			id: generateResourceId("quoting", "quote"),
		};
	}

	public store(quote: Quote) {
		const quoteTableName = process.env.QUOTE_TABLE_NAME;
		const request = new PutCommand({
			TableName: quoteTableName,
			Item: quote,
		});
		this.dbClient.send(request);
	}
}
