import { ColumnRef,
         ResTarget,
         AStar,
         RangeVar,
         SelectStmt,
         BoolExpr,
         NullTest,
         AExpr,
         AConst,
         StringValue,
         AArrayExpr,
         IntegerValue,
         FloatValue,
         SortBy,
         TypeCast,
         TypeName,
         FuncCall,
         WindowDef,
         RangeSubselect,
         WithClause,
         CommonTableExpr,
         RangeFunction,
         JoinExpr,
         Alias,
         CoalesceExpr,
         SubLink } from './helpers';

import { ConditionType } from '../condition';
import { OperatorType } from '../operator';

// import { SelectStmt } from './ast/helpers';

export default class Converter {
  toAST(query, {sort, pageSize, pageIndex, boundingBox, searchFilter}) {
    const targetList = this.targetList(query, sort);

    const fromClause = this.fromClause(query);

    const whereClause = this.whereClause(query, boundingBox, searchFilter);

    const sortClause = sort;

    const limitOffset = this.limitOffset(pageSize, pageIndex);

    const limitCount = this.limitCount(pageSize);

    return SelectStmt({targetList, fromClause, whereClause, sortClause, limitOffset, limitCount});
  }

  toCountAST(query, {boundingBox, searchFilter}) {
    const targetList = [ ResTarget(FuncCall('count', [ AConst(IntegerValue(1)) ]), 'total_count') ];

    const fromClause = this.fromClause(query);

    const whereClause = this.whereClause(query, boundingBox, searchFilter);

    return SelectStmt({targetList, fromClause, whereClause});
  }

  toTileAST(query, {searchFilter}) {
    const targetList = [
      ResTarget(ColumnRef('_record_id')),
      ResTarget(FuncCall('st_x', [ ColumnRef('_geometry') ]), 'x'),
      ResTarget(FuncCall('st_y', [ ColumnRef('_geometry') ]), 'y'),
      ResTarget(ColumnRef('_status')),
      ResTarget(TypeCast(TypeName('text'), AConst(StringValue(query.form.id))), 'form_id')
    ];

    const fromClause = this.fromClause(query);

    const whereClause = this.whereClause(query, null, searchFilter);

    return SelectStmt({targetList, fromClause, whereClause});
  }

  toHistogramAST(query, {columnName, bucketSize, type, sort, pageSize, pageIndex, boundingBox, searchFilter}) {
    const targetList = [
      ResTarget(ColumnRef('series', 'series'), 'bucket'),
      ResTarget(CoalesceExpr([ ColumnRef('count', 'sub'), AConst(IntegerValue(0)) ]), 'count'),
      ResTarget(ColumnRef('min_value', 'sub'), 'min_value'),
      ResTarget(ColumnRef('max_value', 'sub'), 'max_value'),
      ResTarget(ColumnRef('avg_value', 'sub'), 'avg_value'),
      ResTarget(ColumnRef('sum_value', 'sub'), 'sum_value')
    ];

    const withClause = this.histogramWithClause(columnName, bucketSize, type, query);

    const seriesFunctionSublinkSelect = SelectStmt({
      targetList: [ ResTarget(AExpr(0, '+', ColumnRef('buckets'), AConst(IntegerValue(1)))) ],
      fromClause: [ RangeVar('__stats') ]
    });

    const seriesFunctionArgs = [
      AConst(IntegerValue(1)),
      SubLink(4, seriesFunctionSublinkSelect)
    ];

    const seriesFunctionCall = FuncCall('generate_series', seriesFunctionArgs);
    const seriesFunction = RangeFunction([ [ seriesFunctionCall ] ], Alias('series'));

    const bucketWidthFunctionCallArgs = [
      TypeCast(TypeName([ StringValue('pg_catalog'), StringValue('float8') ]), ColumnRef('value')),
      SubLink(4, SelectStmt({targetList: [ ResTarget(ColumnRef('min_value')) ], fromClause: [ RangeVar('__stats') ]})),
      SubLink(4, SelectStmt({targetList: [ ResTarget(ColumnRef('max_value')) ], fromClause: [ RangeVar('__stats') ]})),
      SubLink(4, SelectStmt({targetList: [ ResTarget(ColumnRef('buckets')) ], fromClause: [ RangeVar('__stats') ]}))
    ];

    const bucketsSubqueryTargetList = [
      ResTarget(FuncCall('width_bucket', bucketWidthFunctionCallArgs), 'bucket'),
      ResTarget(FuncCall('count', [ AConst(IntegerValue(1)) ]), 'count'),
      ResTarget(FuncCall('min', [ ColumnRef('value') ]), 'min_value'),
      ResTarget(FuncCall('max', [ ColumnRef('value') ]), 'max_value'),
      ResTarget(FuncCall('avg', [ ColumnRef('value') ]), 'avg_value'),
      ResTarget(FuncCall('sum', [ ColumnRef('value') ]), 'sum_value')
    ];

    const bucketsSubqueryFromClause = [ RangeVar('__records') ];
    const bucketsSubqueryGroupClause = [ AConst(IntegerValue(1)) ];
    const bucketsSubquerySortClause = [ SortBy(AConst(IntegerValue(1)), 0, 0) ];

    const bucketsSubquery = SelectStmt({
      targetList: bucketsSubqueryTargetList,
      fromClause: bucketsSubqueryFromClause,
      groupClause: bucketsSubqueryGroupClause,
      sortClause: bucketsSubquerySortClause
    });

    const bucketsSubselect = RangeSubselect(bucketsSubquery, Alias('sub'));

    const joinExpr = JoinExpr(1,
                              seriesFunction,
                              bucketsSubselect,
                              AExpr(0, '=', ColumnRef('series', 'series'), ColumnRef('bucket', 'sub')));

    return SelectStmt({targetList, fromClause: [ joinExpr ], withClause});
  }

  toDistinctValuesAST(query, options = {}) {
    const targetList = options.array ? [ ResTarget(FuncCall('unnest', [ ColumnRef(options.name) ]), 'value') ]
                                     : [ ResTarget(ColumnRef(options.name), 'value') ];

    targetList.push(ResTarget(FuncCall('count', [ AConst(IntegerValue(1)) ]), 'count'));

    const fromClause = this.fromClause(query);

    const whereClause = null; // this.whereClause(query);

    const groupClause = [ AConst(IntegerValue(1)) ];

    const sortClause = [];

    if (options.by === 'frequency') {
      sortClause.push(SortBy(AConst(IntegerValue(2)), 2, 0));
    }

    sortClause.push(SortBy(AConst(IntegerValue(1)), 1, 0));

    return SelectStmt({targetList, fromClause, whereClause, groupClause, sortClause});
  }

  histogramWithClause(columnName, bucketSize, type, query) {
    let recordsTargetList = null;

    if (type === 'date') {
      const datePartArgs = [
        AConst(StringValue('epoch')),
        TypeCast(TypeName('date'), ColumnRef(columnName))
      ];

      recordsTargetList = [ ResTarget(FuncCall('date_part', datePartArgs), 'value') ];
    } else {
      recordsTargetList = [ ResTarget(TypeCast(TypeName([ StringValue('pg_catalog'), StringValue('float8') ]), ColumnRef(columnName)), 'value') ];
    }

    const recordsFromClause = [ RangeVar(query.form.id + '/_full') ];
    const recordsSelect = SelectStmt({targetList: recordsTargetList, fromClause: recordsFromClause});
    const recordsExpr = CommonTableExpr('__records', recordsSelect);

    const statsTargetList = [
      ResTarget(AConst(IntegerValue(bucketSize)), 'buckets'),
      ResTarget(FuncCall('count', [ AConst(IntegerValue(1)) ]), 'count'),
      ResTarget(FuncCall('min', [ ColumnRef('value') ]), 'min_value'),
      ResTarget(FuncCall('max', [ ColumnRef('value') ]), 'max_value')
    ];

    const statsFromClause = [ RangeVar('__records') ];
    const statsSelect = SelectStmt({targetList: statsTargetList, fromClause: statsFromClause});
    const statsExpr = CommonTableExpr('__stats', statsSelect);

    return WithClause([ recordsExpr, statsExpr ]);
  }

  limitOffset(pageSize, pageIndex) {
    if (pageSize != null && pageIndex != null) {
      return AConst(IntegerValue(+pageIndex * +pageSize));
    }

    return null;
  }

  limitCount(pageSize) {
    if (pageSize != null) {
      return AConst(IntegerValue(+pageSize));
    }

    return null;
  }

  targetList(query, sort) {
    return [
      ResTarget(ColumnRef(AStar())),
      ResTarget(FuncCall('row_number', null, WindowDef(sort, 530)), '_row_number')
    ];
  }

  fromClause(query) {
    return [ RangeVar(query.form.id + '/_full') ];
  }

  whereClause(query, boundingBox, search) {
    const systemParts = [];
    const filterNode = this.nodeForCondition(query.filter);

    if (boundingBox) {
      systemParts.push(this.boundingBoxFilter(boundingBox));
    }

    if (search && search.trim().length) {
      systemParts.push(this.searchFilter(search));
    }

    const columnFilterKeys = Object.keys(query.columnFilters);

    if (columnFilterKeys.length) {
      for (const key of columnFilterKeys) {
        const filter = query.columnFilters[key];

        if (filter.hasValues) {
          let hasNull = false;
          const values = [];

          filter.value.forEach(v => {
            if (v !== null) {
              values.push(AConst(StringValue(v)));
            } else {
              hasNull = true;
            }
          });

          let expr = null;

          if (values.length) {
            expr = AExpr(6, '=', ColumnRef(filter.columnName),
                         values);

            if (hasNull) {
              expr = BoolExpr(1, [ NullTest(0, ColumnRef(filter.columnName)), expr ]);
            }
          } else if (hasNull) {
            expr = NullTest(0, ColumnRef(filter.columnName));
          }

          systemParts.push(expr);
        } else if (filter.isEmptySet) {
          // add 1 = 0 clause to return 0 rows
          const expr = AExpr(0, '=', AConst(IntegerValue(1)),
                             AConst(IntegerValue(0)));

          systemParts.push(expr);
        }
      }
    }

    if (filterNode && systemParts.length) {
      return BoolExpr(0, [ filterNode, ...systemParts ]);
    } else if (systemParts.length) {
      return BoolExpr(0, [ ...systemParts ]);
    }

    return filterNode;
  }

  boundingBoxFilter(boundingBox) {
    const args = [
      AConst(FloatValue(boundingBox[0])),
      AConst(FloatValue(boundingBox[1])),
      AConst(FloatValue(boundingBox[2])),
      AConst(FloatValue(boundingBox[3])),
      AConst(IntegerValue(4326))
    ];

    const rhs = FuncCall('st_makeenvelope', args);

    return AExpr(0, '&&', ColumnRef('_geometry'), rhs);
  }

  escapeLikePercent(value) {
    return value.replace(/\%/g, '\\%');
  }

  searchFilter(search) {
    /*
       Search takes the general form:

       SELECT ...
       FROM ...
       WHERE
         _record_index @@ to_tsquery('english', '''bacon'':*'::tsquery::text) AND
         _record_index_text ILIKE '%bacon%'

       NB: The awkward cast through a text type is to properly escape raw user input as a tsquery.

       For example:
         to_tsquery('Nor:*') vs 'Nor:*'::tsquery

       Also, the ILIKE handles further reduces the resultset to exact matches which is what Fulcrum
       users more often expect. The general idea is to use the FTS index to massively reduce the result
       set before applying the much slower ILIKE operation. So, we can reduce the result very quickly
       with the tsvector index first, and then only run the ILIKE on what's left.
    */

    search = search.trim();

    const toTsQuery = (dictionary, term) => {
      const args = [ AConst(StringValue(dictionary)), AConst(StringValue("'" + term + "':*")) ];

      return FuncCall('to_tsquery', args);
    };

    const makeTsQueryCall = (term) => {
      return toTsQuery(term.length > 3 ? 'english' : 'simple',
                       term.toLowerCase().replace(/'/g, "''"));
    };

    const terms = search.split(' ').filter(s => s.trim().length);

    let term = terms.shift();

    let tsQueries = makeTsQueryCall(term);

    while (terms.length) {
      term = terms.shift();
      tsQueries = AExpr(0, '&&', tsQueries, makeTsQueryCall(term));
    }

    const ftsExpression = AExpr(0, '@@', ColumnRef('_record_index'), tsQueries);

    const ilikeExpression = AExpr(8, '~~*', ColumnRef('_record_index_text'),
                                  AConst(StringValue('%' + this.escapeLikePercent(search) + '%')));

    const andArgs = [
      ftsExpression,
      ilikeExpression
    ];

    return BoolExpr(0, andArgs);
  }

  nodeForExpressions(expressions) {
    return expressions.map(e => this.nodeForExpression(e))
                      .filter(e => e);
  }

  nodeForCondition(condition) {
    const converter = {
      [ConditionType.And]: this.AndConverter,
      [ConditionType.Or]: this.OrConverter,
      [ConditionType.Not]: this.NotConverter
    };

    return converter[condition.type](condition);
  }

  nodeForExpression(expression) {
    if (expression.expressions) {
      return this.nodeForCondition(expression);
    }

    const converter = {
      [OperatorType.Empty.name]: this.EmptyConverter,
      [OperatorType.NotEmpty.name]: this.NotEmptyConverter,
      [OperatorType.Equal.name]: this.EqualConverter,
      [OperatorType.NotEqual.name]: this.NotEqualConverter,
      [OperatorType.GreaterThan.name]: this.GreaterThanConverter,
      [OperatorType.GreaterThanOrEqual.name]: this.GreaterThanOrEqualConverter,
      [OperatorType.LessThan.name]: this.LessThanConverter,
      [OperatorType.LessThanOrEqual.name]: this.LessThanOrEqualConverter,
      [OperatorType.Between.name]: this.BetweenConverter,
      [OperatorType.NotBetween.name]: this.NotBetweenConverter,
      [OperatorType.In.name]: this.InConverter,
      [OperatorType.NotIn.name]: this.NotInConverter,
      [OperatorType.TextContain.name]: this.TextContainConverter,
      [OperatorType.TextNotContain.name]: this.TextNotContainConverter,
      [OperatorType.TextStartsWith.name]: this.TextStartsWithConverter,
      [OperatorType.TextEndsWith.name]: this.TextEndsWithConverter,
      [OperatorType.TextEqual.name]: this.TextEqualConverter,
      [OperatorType.TextNotEqual.name]: this.TextNotEqualConverter,
      [OperatorType.TextMatch.name]: this.TextMatchConverter,
      [OperatorType.TextNotMatch.name]: this.TextNotMatchConverter,
      [OperatorType.DateEqual.name]: this.DateEqualConverter,
      [OperatorType.DateAfter.name]: this.DateAfterConverter,
      [OperatorType.DateBefore.name]: this.DateBeforeConverter,
      [OperatorType.ArrayAnyOf.name]: this.ArrayAnyOfConverter,
      [OperatorType.ArrayAllOf.name]: this.ArrayAllOfConverter,
      [OperatorType.ArrayEqual.name]: this.ArrayEqualConverter,
      [OperatorType.Search.name]: this.SearchConverter
    };

    if (!expression.isValid) {
      return null;
    }

    return converter[expression.operator](expression);
  }

  BooleanConverter = (type, condition) => {
    const args = this.nodeForExpressions(condition.expressions);

    if (args && args.length) {
      return BoolExpr(type, args);
    }

    return null;
  }

  AndConverter = (condition) => {
    return this.BooleanConverter(0, condition);
  }

  OrConverter = (condition) => {
    return this.BooleanConverter(1, condition);
  }

  NotConverter = (condition) => {
    if (condition.expressions.length > 1) {
      return BoolExpr(2, [ this.BooleanConverter(0, condition) ]);
    }

    return this.BooleanConverter(2, condition);
  }

  NotEmptyConverter = (expression) => {
    return NullTest(1, ColumnRef(expression.columnName));
  }

  EmptyConverter = (expression) => {
    return NullTest(0, ColumnRef(expression.columnName));
  }

  EqualConverter = (expression) => {
    return this.BinaryConverter(0, '=', expression);
  }

  NotEqualConverter = (expression) => {
    return this.BinaryConverter(0, '<>', expression);
  }

  GreaterThanConverter = (expression) => {
    return this.BinaryConverter(0, '>', expression);
  }

  GreaterThanOrEqualConverter = (expression) => {
    return this.BinaryConverter(0, '>=', expression);
  }

  LessThanConverter = (expression) => {
    return this.BinaryConverter(0, '<', expression);
  }

  LessThanOrEqualConverter = (expression) => {
    return this.BinaryConverter(0, '<=', expression);
  }

  InConverter = (expression) => {
    const values = expression.value.map(v => AConst(StringValue(v)));

    return AExpr(6, '=', ColumnRef(expression.columnName),
                 values);
  }

  NotInConverter = (expression) => {
    const values = expression.value.map(v => AConst(StringValue(v)));

    return AExpr(6, '<>', ColumnRef(expression.columnName),
                 values);
  }

  BinaryConverter = (kind, operator, expression) => {
    return AExpr(0, operator, ColumnRef(expression.columnName),
                 AConst(StringValue(expression.scalarValue)));
  }

  FieldConverter = (expression) => {
    return ColumnRef(expression.name);
  }

  ConstantConverter = (expression) => {
    return AConst(StringValue(expression.scalarValue));
  }

  TextEqualConverter = (expression) => {
    return AExpr(8, '~~*', ColumnRef(expression.columnName),
                 AConst(StringValue(expression.scalarValue)));
  }

  TextNotEqualConverter = (expression) => {
    return AExpr(8, '!~~*', ColumnRef(expression.columnName),
                 AConst(StringValue(expression.scalarValue)));
  }

  TextContainConverter = (expression) => {
    return AExpr(8, '~~*', ColumnRef(expression.columnName),
                 AConst(StringValue('%' + this.escapeLikePercent(expression.scalarValue) + '%')));
  }

  TextNotContainConverter = (expression) => {
    return AExpr(8, '!~~*', ColumnRef(expression.columnName),
                 AConst(StringValue('%' + this.escapeLikePercent(expression.scalarValue) + '%')));
  }

  TextStartsWithConverter = (expression) => {
    return AExpr(8, '~~*', ColumnRef(expression.columnName),
                 AConst(StringValue(this.escapeLikePercent(expression.scalarValue) + '%')));
  }

  TextEndsWithConverter = (expression) => {
    return AExpr(8, '~~*', ColumnRef(expression.columnName),
                 AConst(StringValue('%' + this.escapeLikePercent(expression.scalarValue))));
  }

  TextMatchConverter = (expression) => {
    return AExpr(0, '~*', ColumnRef(expression.columnName),
                 AConst(StringValue(expression.scalarValue)));
  }

  TextNotMatchConverter = (expression) => {
    return AExpr(0, '!~*', ColumnRef(expression.columnName),
                 AConst(StringValue(expression.scalarValue)));
  }

  ArrayAnyOfConverter = (expression) => {
    const values = AArrayExpr(expression.value.map(v => AConst(StringValue(v))));

    return AExpr(0, '&&', ColumnRef(expression.columnName),
                 values);
  }

  ArrayAllOfConverter = (expression) => {
    const values = AArrayExpr(expression.value.map(v => AConst(StringValue(v))));

    return AExpr(0, '@>', ColumnRef(expression.columnName),
                 values);
  }

  ArrayEqualConverter = (expression) => {
    const values = AArrayExpr(expression.value.map(v => AConst(StringValue(v))));

    const a = AExpr(0, '<@', ColumnRef(expression.columnName),
                    values);

    const b = AExpr(0, '@>', ColumnRef(expression.columnName),
                    values);

    return BoolExpr(0, [ a, b ]);
  }

  SearchConverter = (expression) => {
    const rhs = FuncCall('to_tsquery', [ AConst(StringValue(expression.scalarValue)) ]);

    return AExpr(0, '@@', ColumnRef(expression.columnName),
                 rhs);
  }
}