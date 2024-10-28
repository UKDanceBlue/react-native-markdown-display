import getTokenTypeByToken from "./getTokenTypeByToken";
import flattenInlineTokens from "./flattenInlineTokens";
import renderInlineAsText from "./renderInlineAsText";
import { Token } from "markdown-it";
import TextToken from "./Token";

export function cleanupTokens(
  tokens: (Token | TextToken)[]
): (Token | TextToken)[] {
  tokens = flattenInlineTokens(tokens);
  tokens.forEach((token) => {
    token.type = getTokenTypeByToken(token);

    // set image and hardbreak to block elements
    if (token.type === "image" || token.type === "hardbreak") {
      token.block = true;
    }

    // Set img alt text
    if (token.type === "image") {
      if (token.attrs)
        token.attrs[token.attrIndex("alt")][1] = renderInlineAsText(
          token.children ?? []
        );
    }
  });

  /**
   * changing a link token to a blocklink to fix issue where link tokens with
   * nested non text tokens breaks component
   */
  const stack: (Token | TextToken)[] = [];
  tokens = tokens.reduce<(Token | TextToken)[]>((acc, token) => {
    if (token.type === "link" && token.nesting === 1) {
      stack.push(token);
    } else if (
      stack.length > 0 &&
      token.type === "link" &&
      token.nesting === -1
    ) {
      if (stack.some((stackToken) => stackToken.block)) {
        stack[0].type = "blocklink";
        stack[0].block = true;
        token.type = "blocklink";
        token.block = true;
      }

      stack.push(token);

      while (stack.length) {
        acc.push(stack.shift()!);
      }
    } else if (stack.length > 0) {
      stack.push(token);
    } else {
      acc.push(token);
    }

    return acc;
  }, []);

  return tokens;
}