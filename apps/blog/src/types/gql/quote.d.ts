declare type GetQuoteVariables = {} & GetItemVariables;

declare type QuoteData = {
    quoteCollection: {
        total: number;
        limit: number;
        items: QuoteItem[]
    }
}

declare type QuoteItem = {
    person: string;
    saying: string;
    sys: Sys;
    contentFulMetadata: ContentfulMetadata;
}

declare type QuoteCollection = {
    items: QuoteItem[];
    limit: number;
    skip: number;
    total: number;
}
