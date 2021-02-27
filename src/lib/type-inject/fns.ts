import generator from '@babel/generator';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { parserOption } from '../../call-expressions/ast';

export function appendExportAsObject(dtsContent: string) {
  // TODO: Build ast?

  let allExportsCode = `export declare type __GraphQLLetTypeInjection = { `;
  function pushProps({
    node: {
      id: { name },
    },
  }: any) {
    allExportsCode += `${name}: typeof ${name},`;
  }

  const visitors: any = {
    TSDeclareFunction: pushProps,
    VariableDeclarator: pushProps,
    // We cannot export TSTypeAliasDeclaration, since gql() cannot return type.
  };

  const dtsAST = parse(dtsContent, parserOption);
  traverse(dtsAST, {
    ExportNamedDeclaration(path: any) {
      path.traverse(visitors);
    },
    Program: {
      exit(path: NodePath<t.Program>) {
        allExportsCode += '};';
        // TODO: refactor
        traverse(parse(allExportsCode, parserOption), {
          ExportNamedDeclaration({ node }) {
            const body = path.get('body');
            body[body.length - 1].insertAfter(node);
          },
        });
      },
    },
  });

  const { code } = generator(dtsAST);
  return code;
}
