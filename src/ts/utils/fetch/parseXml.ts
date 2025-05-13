import { memoize } from './memoize';

// Turn XML into readable DOM with DOMParser and use XPathEvaluator to do the equivalent of querySelectoring text inside an element
// https://developer.mozilla.org/en-US/docs/Web/XML/XPath/Guides/Snippets
const parseXml = (data: string, aExpr: string) => {
  const parser = new DOMParser();
  const aNode = parser.parseFromString(data, 'application/xml');
  const xpe = new XPathEvaluator();
  const nsResolver = aNode.documentElement;
  const result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  const found = [];
  let res;
  while ((res = result.iterateNext())) found.push(res);
  return found;
};

const parseXmlMemo = memoize(parseXml);

export { parseXmlMemo as parseXml };
