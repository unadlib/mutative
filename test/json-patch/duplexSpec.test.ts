/* eslint-disable prefer-arrow-callback */
// @ts-nocheck
import { create, apply } from '../../src';

describe('duplex', function () {
  describe('base', function () {
    it('should replace', function () {
      const obj = {
        firstName: 'Albert',
        lastName: 'Einstein',
        phoneNumbers: [
          {
            number: '12345',
          },
          {
            number: '45353',
          },
        ],
      };

      const [draft, finalize] = create(obj, { enablePatches: true });
      draft.firstName = 'Joachim';
      draft.lastName = 'Wester';
      draft.phoneNumbers[0].number = '123';
      draft.phoneNumbers[1].number = '456';

      const [state, patches] = finalize();
      const obj2 = {
        firstName: 'Albert',
        lastName: 'Einstein',
        phoneNumbers: [
          {
            number: '12345',
          },
          {
            number: '45353',
          },
        ],
      };
      expect(apply(obj2, patches)).toEqual(state);
    });

    it('should generate replace (escaped chars)', function () {
      const obj = {
        '/name/first': 'Albert',
        '/name/last': 'Einstein',
        '~phone~/numbers': [
          {
            number: '12345',
          },
          {
            number: '45353',
          },
        ],
      };

      const [draft, finalize] = create(obj, { enablePatches: true });
      draft['/name/first'] = 'Joachim';
      draft['/name/last'] = 'Wester';
      draft['~phone~/numbers'][0].number = '123';
      draft['~phone~/numbers'][1].number = '456';

      const [state, patches] = finalize();
      const obj2 = {
        '/name/first': 'Albert',
        '/name/last': 'Einstein',
        '~phone~/numbers': [
          {
            number: '12345',
          },
          {
            number: '45353',
          },
        ],
      };
      expect(apply(obj2, patches)).toEqual(state);
    });

    // it(
    //   'should generate replace (2 observers)',
    //   [
    //     ['invertible = FALSE', false],
    //     ['invertible = TRUE', true],
    //   ],
    //   function (testInvertible) {
    //     return function () {
    //       const person1 = {
    //         firstName: 'Alexandra',
    //         lastName: 'Galbreath',
    //       };
    //       const person2 = {
    //         firstName: 'Lisa',
    //         lastName: 'Mendoza',
    //       };

    //       const observer1 = jsonpatch.observe(person1);
    //       const observer2 = jsonpatch.observe(person2);

    //       person1.firstName = 'Alexander';
    //       person2.firstName = 'Lucas';

    //       const patch1 = jsonpatch.generate(observer1, testInvertible);
    //       const patch2 = jsonpatch.generate(observer2, testInvertible);

    //       expect(patch1).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/firstName',
    //           value: 'Alexandra',
    //         }),
    //         {
    //           op: 'replace',
    //           path: '/firstName',
    //           value: 'Alexander',
    //         },
    //       ]);
    //       expect(patch2).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/firstName',
    //           value: 'Lisa',
    //         }),
    //         {
    //           op: 'replace',
    //           path: '/firstName',
    //           value: 'Lucas',
    //         },
    //       ]);
    //     };
    //   }
    // );

    // it(
    //   'should generate test and replace (double change, shallow object)',
    //   [
    //     ['invertible = FALSE', false],
    //     ['invertible = TRUE', true],
    //   ],
    //   function (testInvertible) {
    //     return function () {
    //       const obj = {
    //         firstName: 'Albert',
    //         lastName: 'Einstein',
    //         phoneNumbers: [
    //           {
    //             number: '12345',
    //           },
    //           {
    //             number: '45353',
    //           },
    //         ],
    //       };

    //       const observer = jsonpatch.observe(obj);
    //       obj.firstName = 'Marcin';

    //       let patches = jsonpatch.generate(observer, testInvertible);
    //       expect(patches).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/firstName',
    //           value: 'Albert',
    //         }),
    //         {
    //           op: 'replace',
    //           path: '/firstName',
    //           value: 'Marcin',
    //         },
    //       ]);

    //       obj.lastName = 'Warp';
    //       patches = jsonpatch.generate(observer, testInvertible); //first patch should NOT be reported again here
    //       expect(patches).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/lastName',
    //           value: 'Einstein',
    //         }),
    //         {
    //           op: 'replace',
    //           path: '/lastName',
    //           value: 'Warp',
    //         },
    //       ]);

    //       expect(obj).toEqual({
    //         firstName: 'Marcin',
    //         lastName: 'Warp',
    //         phoneNumbers: [
    //           {
    //             number: '12345',
    //           },
    //           {
    //             number: '45353',
    //           },
    //         ],
    //       }); //objects should be still the same
    //     };
    //   }
    // );

    // it(
    //   'should generate test and replace (double change, shallow object)',
    //   [
    //     ['invertible = FALSE', false],
    //     ['invertible = TRUE', true],
    //   ],
    //   function (testInvertible) {
    //     return function () {
    //       const obj = {
    //         firstName: 'Albert',
    //         lastName: 'Einstein',
    //         phoneNumbers: [
    //           {
    //             number: '12345',
    //           },
    //           {
    //             number: '45353',
    //           },
    //         ],
    //       };

    //       const observer = jsonpatch.observe(obj);
    //       obj.phoneNumbers[0].number = '123';

    //       let patches = jsonpatch.generate(observer, testInvertible);
    //       expect(patches).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/phoneNumbers/0/number',
    //           value: '12345',
    //         }),
    //         {
    //           op: 'replace',
    //           path: '/phoneNumbers/0/number',
    //           value: '123',
    //         },
    //       ]);

    //       obj.phoneNumbers[1].number = '456';
    //       patches = jsonpatch.generate(observer, testInvertible); //first patch should NOT be reported again here
    //       expect(patches).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/phoneNumbers/1/number',
    //           value: '45353',
    //         }),
    //         {
    //           op: 'replace',
    //           path: '/phoneNumbers/1/number',
    //           value: '456',
    //         },
    //       ]);

    //       expect(obj).toEqual({
    //         firstName: 'Albert',
    //         lastName: 'Einstein',
    //         phoneNumbers: [
    //           {
    //             number: '123',
    //           },
    //           {
    //             number: '456',
    //           },
    //         ],
    //       }); //objects should be still the same
    //     };
    //   }
    // );

    it('should generate replace (changes in new array cell, primitive values)', function () {
      let arr = [1];
      let patches = [];

      let [draft, finalize] = create(arr, {
        enablePatches: { pathAsArray: false },
      });
      draft.push(2);

      [arr, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'add',
          path: '/1',
          value: 2,
        },
      ]);

      [draft, finalize] = create(arr, {
        enablePatches: { pathAsArray: false },
      });
      draft[0] = 3;

      [arr, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'replace',
          path: '/0',
          value: 3,
        },
      ]);

      [draft, finalize] = create(arr, {
        enablePatches: { pathAsArray: false },
      });
      draft[1] = 4;

      [arr, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'replace',
          path: '/1',
          value: 4,
        },
      ]);
    });

    it('should generate replace (changes in new array cell, complex values)', function () {
      let arr = [
        {
          id: 1,
          name: 'Ted',
        },
      ];

      let patches = [];

      let [draft, finalize] = create(arr, {
        enablePatches: { pathAsArray: false },
      });
      draft.push({
        id: 2,
        name: 'Jerry',
      });

      [arr, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'add',
          path: '/1',
          value: {
            id: 2,
            name: 'Jerry',
          },
        },
      ]);

      [draft, finalize] = create(arr, {
        enablePatches: { pathAsArray: false },
      });

      draft[0].id = 3;

      [arr, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'replace',
          path: '/0/id',
          value: 3,
        },
      ]);

      [draft, finalize] = create(arr, {
        enablePatches: { pathAsArray: false },
      });

      draft[1].id = 4;

      [arr, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'replace',
          path: '/1/id',
          value: 4,
        },
      ]);
    });

    it('should not mutate the document (object to array substitution)', function () {
      const obj = {
        data: { foo: 'bar' },
      };

      let patches = [];

      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });
      draft.data = [1, 2];

      const obj2 = JSON.parse(JSON.stringify(obj));

      finalize();
      expect(obj2).toEqual(obj);
    });

    it('should generate replace (object to array substitution)', function () {
      const obj = {
        data: { foo: 'bar' },
      };

      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });
      draft.data = [1, 2];

      const [state, patches] = finalize();

      const obj2 = {
        data: { foo: 'bar' },
      };

      expect(apply(obj2, patches)).toEqual(state);
    });

    it('should generate replace (empty object to empty array substitution)', function () {
      const obj = {
        data: {},
      };

      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });
      draft.data = [];

      const [state, patches] = finalize();

      const obj2 = {
        data: {},
      };

      expect(apply(obj2, patches)).toEqual(state);
    });

    it('should generate add', function () {
      const obj = {
        lastName: 'Einstein',
        phoneNumbers: [
          {
            number: '12345',
          },
        ],
      };
      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });

      draft.firstName = 'Joachim';
      draft.lastName = 'Wester';
      draft.phoneNumbers[0].number = '123';
      draft.phoneNumbers.push({
        number: '456',
      });

      const [state, patches] = finalize();
      const obj2 = {
        lastName: 'Einstein',
        phoneNumbers: [
          {
            number: '12345',
          },
        ],
      };

      expect(apply(obj2, patches)).toEqual(state);
    });

    it('should generate remove', function () {
      const obj = {
        lastName: 'Einstein',
        firstName: 'Albert',
        phoneNumbers: [
          {
            number: '12345',
          },
          {
            number: '4234',
          },
        ],
      };
      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });

      delete draft.firstName;
      draft.lastName = 'Wester';
      draft.phoneNumbers[0].number = '123';
      draft.phoneNumbers.pop(1);

      const [state, patches] = finalize();
      const obj2 = {
        lastName: 'Einstein',
        firstName: 'Albert',
        phoneNumbers: [
          {
            number: '12345',
          },
          {
            number: '4234',
          },
        ],
      };

      expect(apply(obj2, patches)).toEqual(state);
    });

    // variantIt(
    //   'should generate test and replace (double change, shallow object)',
    //   [
    //     ['invertible = FALSE', false],
    //     ['invertible = TRUE', true],
    //   ],
    //   function (testInvertible) {
    //     return function () {
    //       const obj = {
    //         items: ['a', 'b', 'c'],
    //       };
    //       const observer = jsonpatch.observe(obj);

    //       obj.items.pop();
    //       obj.items.pop();

    //       const patches = jsonpatch.generate(observer, testInvertible);

    //       //array indexes must be sorted descending, otherwise there is an index collision in apply
    //       expect(patches).toEqual([
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/items/2',
    //           value: 'c',
    //         }),
    //         {
    //           op: 'remove',
    //           path: '/items/2',
    //         },
    //         ...insertIf(testInvertible, {
    //           op: 'test',
    //           path: '/items/1',
    //           value: 'b',
    //         }),
    //         {
    //           op: 'remove',
    //           path: '/items/1',
    //         },
    //       ]);

    //       const obj2 = {
    //         items: ['a', 'b', 'c'],
    //       };
    //       jsonpatch.applyPatch(obj2, patches);
    //       expect(obj).toEqualInJson(obj2);
    //     };
    //   }
    // );

    it('should not generate the same patch twice (replace)', function () {
      const obj = {
        lastName: 'Einstein',
      };
      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });

      draft.lastName = 'Wester';

      let [state, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'replace',
          path: '/lastName',
          value: 'Wester',
        },
      ]);

      expect(() => {
        finalize();
      }).toThrow();
    });

    it('should not generate the same patch twice (add)', function () {
      const obj = {
        lastName: 'Einstein',
      };
      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });

      draft.firstName = 'Albert';

      let [state, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'add',
          path: '/firstName',
          value: 'Albert',
        },
      ]);

      expect(() => {
        finalize();
      }).toThrow();
    });

    it('should not generate the same patch twice (remove)', function () {
      const obj = {
        lastName: 'Einstein',
      };
      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });

      delete draft.lastName;

      let [state, patches] = finalize();
      expect(patches).toEqual([
        {
          op: 'remove',
          path: '/lastName',
        },
      ]);

      expect(() => {
        finalize();
      }).toThrow();
    });

    it('should throw error with change array properties', function () {
      const obj = {
        array: [1, 2, 3],
      };

      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });

      expect(() => {
        draft.array.value = 1;
      }).toThrow();

      finalize();
    });

    it('should respect toJSON', function () {
      const a = {};
      a.self = a;
      const obj = {
        a: a,
        b: 3,
        toJSON: function () {
          return {
            b: this.b,
          };
        },
      };

      let [draft, finalize] = create(obj, {
        enablePatches: { pathAsArray: false },
      });
      draft.b = 5;
      let [state, patches] = finalize();
      expect(patches.length).toEqual(1);
    });

    // it('should respect toJSON in nested objects', function () {
    //   const a = {};
    //   a.self = a;
    //   const outer = {
    //     obj: {
    //       a: a,
    //       b: 3,
    //       toJSON: function () {
    //         return {
    //           b: this.b,
    //         };
    //       },
    //     },
    //   };

    //   const observer = jsonpatch.observe(outer);
    //   outer.obj.b = 5;
    //   const patches = jsonpatch.generate(observer);

    //   expect(patches.length).toEqual(1);
    //   expect(patches[0].path).toEqual('/obj/b');
    //   expect(patches[0].value).toEqual(5);
    // });

    /*it('should not generate the same patch twice (move)', function() { //"move" is not implemented yet in jsonpatch.generate
          const obj = { lastName: {str: "Einstein"} };
          const observer = jsonpatch.observe(obj);

          obj.lastName2 = obj.lastName;
          delete obj.lastName;

          const patches = jsonpatch.generate(observer);
          expect(patches).toEqual([
            { op: 'move', from: '/lastName', to: '/lastName2' }
          ]);

          const patches = jsonpatch.generate(observer);
          expect(patches).toEqual([]);
        });*/

    describe('undefined - JS to JSON projection', function () {
      it('when value is set to `undefined`, should generate remove (undefined is JSON.stringified to no value)', function () {
        const obj = {
          foo: 'bar',
        };

        let [draft, finalize] = create(obj, {
          enablePatches: { pathAsArray: false },
        });
        draft.foo = undefined;

        let [state, patches] = finalize();
        // !different from Mutative
        // expect(patches).toEqual([
        //   {
        //     op: 'remove',
        //     path: '/foo',
        //   },
        // ]);
        expect(patches).toEqual([
          {
            op: 'replace',
            path: '/foo',
            value: undefined,
          },
        ]);
      });

      it('when new property is added, and set to `undefined`, nothing should be generated (undefined is JSON.stringified to no value)', function () {
        const obj = {
          foo: 'bar',
        };

        let [draft, finalize] = create(obj, {
          enablePatches: { pathAsArray: false },
        });
        draft.baz = undefined;

        let [state, patches] = finalize();
        // !different from Mutative
        // expect(patches).toEqual([]);
        expect(patches).toEqual([
          {
            op: 'add',
            path: '/baz',
            value: undefined,
          },
        ]);
      });

      it('when array element is set to `undefined`, should generate replace to `null` (undefined array elements are JSON.stringified to `null`)', function () {
        const obj = {
          foo: [0, 1, 2],
        };

        let [draft, finalize] = create(obj, {
          enablePatches: { pathAsArray: false },
        });
        draft.foo[1] = undefined;

        let [state, patches] = finalize();
        // !different from Mutative

        expect(patches).toEqual([
          {
            op: 'replace',
            path: '/foo/1',
            // value: null,
            value: undefined,
          },
        ]);
      });

      it('when `undefined` property is set to something, should generate add (undefined is JSON.stringified to no value)', function () {
        const obj = {
          foo: undefined,
        };

        let [draft, finalize] = create(obj, {
          enablePatches: { pathAsArray: false },
        });
        draft.foo = 'something';

        let [state, patches] = finalize();
        // !different from Mutative
        expect(patches).toEqual([
          {
            // op: 'add',
            op: 'replace',
            path: '/foo',
            value: 'something',
          },
        ]);
      });
      it('when `undefined` array element is set to something, should generate replace (undefined array elements are JSON.stringified to `null`)', function () {
        const obj = {
          foo: [0, undefined, 2],
        };
        let [draft, finalize] = create(obj, {
          enablePatches: { pathAsArray: false },
        });
        draft.foo[1] = 1;

        let [state, patches] = finalize();
        expect(patches).toEqual([
          {
            op: 'replace',
            path: '/foo/1',
            value: 1,
          },
        ]);
      });
    });

    describe('undefined - JSON to JS extension', function () {
      describe('should generate empty patch, when', function () {
        it('when new property is set to `undefined`', function () {
          const objFactory = function () {
            return {
              foo: 'bar',
            };
          };

          const objChanger = function (obj) {
            obj.baz = undefined;
          };

          const [state, patches, inversePatches] = create(
            objFactory(),
            objChanger,
            {
              enablePatches: { pathAsArray: false },
            }
          );

          // const genereatedPatches = getPatchesUsingGenerate(
          //   objFactory,
          //   objChanger
          // );
          // const comparedPatches = getPatchesUsingCompare(
          //   objFactory,
          //   objChanger
          // );
          // !different from Mutative
          expect(patches).toEqual([
            {
              op: 'add',
              path: '/baz',
              value: undefined,
            },
          ]);
          expect(inversePatches).toEqual([
            {
              op: 'remove',
              path: '/baz',
              value: undefined,
            },
          ]);
          // expect(genereatedPatches).toEqual([]);
          // expect(genereatedPatches).toEqual(comparedPatches);
        });

        it('when an `undefined` property is deleted', function () {
          const objFactory = function () {
            return {
              foo: undefined,
            };
          };

          const objChanger = function (obj) {
            delete obj.foo;
          };

          const [state, patches, inversePatches] = create(
            objFactory(),
            objChanger,
            {
              enablePatches: { pathAsArray: false },
            }
          );

          // !different from Mutative
          expect(patches).toEqual([
            {
              op: 'remove',
              path: '/foo',
            },
          ]);
          expect(inversePatches).toEqual([
            {
              op: 'add',
              path: '/foo',
              value: undefined,
            },
          ]);

          // expect(genereatedPatches).toEqual([]);
          // expect(genereatedPatches).toEqual(comparedPatches);
        });
      });

      describe('should generate add, when', function () {
        it('`undefined` property is set to something', function () {
          const objFactory = function () {
            return {
              foo: undefined,
            };
          };

          const objChanger = function (obj) {
            obj.foo = 'something';
          };

          const [state, patches, inversePatches] = create(
            objFactory(),
            objChanger,
            {
              enablePatches: { pathAsArray: false },
            }
          );

          // !different from Mutative
          expect(patches).toEqual([
            {
              op: 'replace',
              path: '/foo',
              value: 'something',
            },
          ]);
          expect(inversePatches).toEqual([
            {
              op: 'replace',
              path: '/foo',
              value: undefined,
            },
          ]);

          // expect(genereatedPatches).toEqual([
          //   {
          //     op: 'add',
          //     path: '/foo',
          //     value: 'something',
          //   },
          // ]);
          // expect(genereatedPatches).toEqual(comparedPatches);
        });
      });

      describe('should generate remove, when', function () {
        it('value is set to `undefined`', function () {
          const objFactory = function () {
            return {
              foo: 'bar',
            };
          };

          const objChanger = function (obj) {
            obj.foo = undefined;
          };

          const [state, patches, inversePatches] = create(
            objFactory(),
            objChanger,
            {
              enablePatches: { pathAsArray: false },
            }
          );
          // !different from Mutative
          expect(patches).toEqual([
            {
              op: 'replace',
              path: '/foo',
              value: undefined,
            },
          ]);
          expect(inversePatches).toEqual([
            {
              op: 'replace',
              path: '/foo',
              value: 'bar',
            },
          ]);
          // expect(genereatedPatches).toEqual([
          //   {
          //     op: 'remove',
          //     path: '/foo',
          //   },
          // ]);
          // expect(genereatedPatches).toEqual(comparedPatches);
        });
      });

      describe('should generate replace, when', function () {
        it('array element is set to `undefined`', function () {
          const objFactory = function () {
            return {
              foo: [0, 1, 2],
            };
          };

          const objChanger = function (obj) {
            obj.foo[1] = undefined;
          };

          const [state, patches, inversePatches] = create(
            objFactory(),
            objChanger,
            {
              enablePatches: { pathAsArray: false },
            }
          );

          // !different from Mutative
          expect(patches).toEqual([
            {
              op: 'replace',
              path: '/foo/1',
              value: undefined,
            },
          ]);
          expect(inversePatches).toEqual([
            {
              op: 'replace',
              path: '/foo/1',
              value: 1,
            },
          ]);

          // expect(genereatedPatches).toEqual([
          //   {
          //     op: 'replace',
          //     path: '/foo/1',
          //     value: null,
          //   },
          // ]);
          // expect(genereatedPatches).toEqual(comparedPatches);
        });
        it('`undefined` array element is set to something', function () {
          const objFactory = function () {
            return {
              foo: [0, undefined, 2],
            };
          };

          const objChanger = function (obj) {
            obj.foo[1] = 1;
          };

          const [state, patches, inversePatches] = create(
            objFactory(),
            objChanger,
            {
              enablePatches: { pathAsArray: false },
            }
          );

          expect(patches).toEqual([
            {
              op: 'replace',
              path: '/foo/1',
              value: 1,
            },
          ]);
          // !different from Mutative
          expect(inversePatches).toEqual([
            {
              op: 'replace',
              path: '/foo/1',
              value: undefined,
            },
          ]);

          // expect(genereatedPatches).toEqual([
          //   {
          //     op: 'replace',
          //     path: '/foo/1',
          //     value: 1,
          //   },
          // ]);
          // expect(genereatedPatches).toEqual(comparedPatches);
        });
      });
    });

    // // https://github.com/Starcounter-Jack/JSON-Patch/issues/209
    // it('should generate only one replace', function () {
    //   var obj1 = {
    //     test: [{ k: 'xx' }, { k: 'yy' }],
    //   };

    //   var obj2 = {
    //     test: {
    //       xx: { k: 'xx' },
    //       yy: { k: 'yy' },
    //     },
    //   };

    //   let patch = jsonpatch.compare(obj1, obj2);

    //   expect(patch.length).toEqual(1);
    //   expect(patch[0]).toEqual({
    //     op: 'replace',
    //     path: '/test',
    //     value: obj2.test,
    //   });
    // });
  });

  describe('apply', function () {
    // https://tools.ietf.org/html/rfc6902#appendix-A.16
    it('should add an Array Value', function () {
      const obj = {
        foo: ['bar'],
      };
      const patches = [
        {
          op: 'add',
          path: '/foo/-',
          value: ['abc', 'def'],
        },
      ];
      expect(apply(obj, patches)).toEqual({
        foo: ['bar', ['abc', 'def']],
      });
    });
  });

  // describe('callback', function () {
  //   it('should generate replace', function (done) {
  //     let patches;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     jsonpatch.observe(obj, function (_patches) {
  //       patches = _patches;
  //       patchesChanged();
  //     });
  //     obj.firstName = 'Joachim';
  //     obj.lastName = 'Wester';
  //     obj.phoneNumbers[0].number = '123';
  //     obj.phoneNumbers[1].number = '456';

  //     trigger('keyup');

  //     function patchesChanged() {
  //       const obj2 = {
  //         firstName: 'Albert',
  //         lastName: 'Einstein',
  //         phoneNumbers: [
  //           {
  //             number: '12345',
  //           },
  //           {
  //             number: '45353',
  //           },
  //         ],
  //       };

  //       jsonpatch.applyPatch(obj2, patches);
  //       expect(obj2).toEqual(obj);
  //       done();
  //     }
  //   });

  //   it('should generate replace (double change, shallow object)', function (done) {
  //     let lastPatches;
  //     let called = 0;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     jsonpatch.observe(obj, function (patches) {
  //       called++;
  //       lastPatches = patches;
  //       patchesChanged(called);
  //     });
  //     obj.firstName = 'Marcin';

  //     trigger('keyup');
  //     // ugly migration from Jasmine 1.x to > 2.0
  //     function patchesChanged(time) {
  //       switch (time) {
  //         case 1:
  //           expect(called).toEqual(1);
  //           expect(lastPatches).toEqual([
  //             {
  //               op: 'replace',
  //               path: '/firstName',
  //               value: 'Marcin',
  //             },
  //           ]);

  //           obj.lastName = 'Warp';
  //           trigger('keyup');
  //           break;
  //         case 2:
  //           expect(called).toEqual(2);
  //           expect(lastPatches).toEqual([
  //             {
  //               op: 'replace',
  //               path: '/lastName',
  //               value: 'Warp',
  //             },
  //           ]); //first patch should NOT be reported again here

  //           expect(obj).toEqual({
  //             firstName: 'Marcin',
  //             lastName: 'Warp',
  //             phoneNumbers: [
  //               {
  //                 number: '12345',
  //               },
  //               {
  //                 number: '45353',
  //               },
  //             ],
  //           }); //objects should be still the same

  //           done();
  //           break;
  //       }
  //     }
  //   });

  //   it('should generate replace (double change, deep object)', function (done) {
  //     let lastPatches;
  //     let called = 0;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     jsonpatch.observe(obj, function (patches) {
  //       called++;
  //       lastPatches = patches;
  //       patchesChanged(called);
  //     });
  //     obj.phoneNumbers[0].number = '123';

  //     trigger('keyup');

  //     // ugly migration from Jasmine 1.x to > 2.0
  //     function patchesChanged(time) {
  //       switch (time) {
  //         case 1:
  //           expect(called).toEqual(1);
  //           expect(lastPatches).toEqual([
  //             {
  //               op: 'replace',
  //               path: '/phoneNumbers/0/number',
  //               value: '123',
  //             },
  //           ]);

  //           obj.phoneNumbers[1].number = '456';
  //           trigger('keyup');
  //           break;
  //         case 2:
  //           expect(called).toEqual(2);
  //           expect(lastPatches).toEqual([
  //             {
  //               op: 'replace',
  //               path: '/phoneNumbers/1/number',
  //               value: '456',
  //             },
  //           ]); //first patch should NOT be reported again here

  //           expect(obj).toEqual({
  //             firstName: 'Albert',
  //             lastName: 'Einstein',
  //             phoneNumbers: [
  //               {
  //                 number: '123',
  //               },
  //               {
  //                 number: '456',
  //               },
  //             ],
  //           }); //objects should be still the same
  //           done();
  //           break;
  //       }
  //     }
  //   });

  //   it('generate should execute callback synchronously', function (done) {
  //     let lastPatches;
  //     let called = 0;
  //     let res;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       called++;
  //       lastPatches = patches;
  //     });
  //     obj.phoneNumbers[0].number = '123';

  //     setTimeout(function () {
  //       expect(called).toEqual(0);

  //       res = jsonpatch.generate(observer);
  //       expect(called).toEqual(1);
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/phoneNumbers/0/number',
  //           value: '123',
  //         },
  //       ]);
  //       expect(lastPatches).toEqual(res);

  //       res = jsonpatch.generate(observer);
  //       expect(called).toEqual(1);
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/phoneNumbers/0/number',
  //           value: '123',
  //         },
  //       ]);
  //       expect(res).toEqual([]);
  //       done();
  //     }, 100);
  //   });

  //   it('should unobserve then observe again', function (done) {
  //     let called = 0;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       called++;
  //     });

  //     obj.firstName = 'Malvin';

  //     trigger('keyup');

  //     // ugly migration from Jasmine 1.x to > 2.0
  //     setTimeout(function () {
  //       expect(called).toEqual(1);

  //       jsonpatch.unobserve(obj, observer);

  //       obj.firstName = 'Wilfred';

  //       trigger('keyup');

  //       setTimeout(function () {
  //         expect(called).toEqual(1);

  //         const observer2 = jsonpatch.observe(obj, function (patches) {
  //           called++;
  //         });

  //         obj.firstName = 'Megan';
  //         trigger('keyup');

  //         setTimeout(function () {
  //           expect(called).toEqual(2);
  //           done();
  //         }, 20);
  //       }, 20);
  //     }, 20);
  //   });

  //   it('should unobserve then observe again (deep value)', function (done) {
  //     let called = 0;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       called++;
  //     });

  //     obj.phoneNumbers[1].number = '555';

  //     trigger('keyup');
  //     // ugly migration from Jasmine 1.x to > 2.0
  //     setTimeout(function () {
  //       expect(called).toEqual(1);

  //       jsonpatch.unobserve(obj, observer);

  //       obj.phoneNumbers[1].number = '556';

  //       trigger('keyup');

  //       setTimeout(function () {
  //         expect(called).toEqual(1);

  //         const observer2 = jsonpatch.observe(obj, function (patches) {
  //           called++;
  //         });

  //         obj.phoneNumbers[1].number = '557';

  //         trigger('keyup');

  //         setTimeout(function () {
  //           expect(called).toEqual(2);
  //           done();
  //         }, 20);
  //       }, 20);
  //     }, 20);
  //   });

  //   it('calling unobserve should deliver pending changes synchronously', function (done) {
  //     let lastPatches = '';

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       lastPatches = patches;
  //     });

  //     obj.firstName = 'Malvin';

  //     jsonpatch.unobserve(obj, observer);

  //     expect(lastPatches[0].value).toBe('Malvin');

  //     obj.firstName = 'Jonathan';

  //     // ugly migration from Jasmine 1.x to > 2.0
  //     setTimeout(function () {
  //       expect(lastPatches[0].value).toBe('Malvin');
  //       done();
  //     }, 20);
  //   });

  //   it('should handle callbacks that calls observe() and unobserve() internally', function (done) {
  //     const obj = {
  //       foo: 'bar',
  //     };

  //     let observer;
  //     let count = 0;
  //     const callback = jasmine
  //       .createSpy('callback', function () {
  //         jsonpatch.unobserve(obj, observer);

  //         jsonpatch.observe(obj, callback);
  //         callbackCalled(++count);
  //       })
  //       .and.callThrough();

  //     observer = jsonpatch.observe(obj, callback);

  //     expect(callback.calls.count()).toEqual(0);

  //     obj.foo = 'bazz';

  //     trigger('keyup');

  //     // ugly migration from Jasmine 1.x to > 2.0
  //     function callbackCalled(time) {
  //       switch (time) {
  //         case 1:
  //           expect(callback.calls.count()).toEqual(1);

  //           obj.foo = 'bazinga';

  //           trigger('keyup');
  //           break;
  //         case 2:
  //           expect(callback.calls.count()).toEqual(2);
  //           done();
  //           break;
  //       }
  //     }
  //   });

  //   it('should generate patch after `mouseup` event while observing', function (done) {
  //     const obj = {
  //       lastName: 'Einstein',
  //     };
  //     let lastPatches;
  //     let callCount = 0;
  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       callCount++;
  //       lastPatches = patches;
  //     });

  //     obj.lastName = 'Hawking';

  //     trigger('mouseup');

  //     setTimeout(function () {
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/lastName',
  //           value: 'Hawking',
  //         },
  //       ]);

  //       observer.unobserve();
  //       obj.lastName = 'Musk';
  //       trigger('mouseup');

  //       setTimeout(function () {
  //         expect(callCount).toEqual(1);
  //         done();
  //       }, 20);
  //     }, 20);
  //   });

  //   it('should generate patch after `mousedown` event while observing', function (done) {
  //     const obj = {
  //       lastName: 'Einstein',
  //     };
  //     let lastPatches;
  //     let callCount = 0;
  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       callCount++;
  //       lastPatches = patches;
  //     });

  //     obj.lastName = 'Hawking';
  //     trigger('mousedown');

  //     setTimeout(function () {
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/lastName',
  //           value: 'Hawking',
  //         },
  //       ]);

  //       observer.unobserve();
  //       obj.lastName = 'Musk';
  //       trigger('mousedown');

  //       setTimeout(function () {
  //         expect(callCount).toEqual(1);
  //         done();
  //       }, 20);
  //     }, 20);
  //   });

  //   it('should generate patch after `keyup` event while observing', function (done) {
  //     const obj = {
  //       lastName: 'Einstein',
  //     };
  //     let lastPatches;
  //     let callCount = 0;
  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       callCount++;
  //       lastPatches = patches;
  //     });

  //     obj.lastName = 'Hawking';
  //     trigger('keyup');

  //     setTimeout(function () {
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/lastName',
  //           value: 'Hawking',
  //         },
  //       ]);

  //       observer.unobserve();
  //       obj.lastName = 'Musk';
  //       trigger('keyup');

  //       setTimeout(function () {
  //         expect(callCount).toEqual(1);
  //         done();
  //       }, 20);
  //     }, 20);
  //   });

  //   it('should generate patch after `keydown` event while observing', function (done) {
  //     const obj = {
  //       lastName: 'Einstein',
  //     };
  //     let lastPatches;
  //     let callCount = 0;
  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       callCount++;
  //       lastPatches = patches;
  //     });

  //     obj.lastName = 'Hawking';
  //     trigger('keydown');

  //     setTimeout(function () {
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/lastName',
  //           value: 'Hawking',
  //         },
  //       ]);

  //       observer.unobserve();
  //       obj.lastName = 'Musk';
  //       trigger('keydown');

  //       setTimeout(function () {
  //         expect(callCount).toEqual(1);
  //         done();
  //       }, 20);
  //     }, 20);
  //   });

  //   it('should generate patch after `change` event while observing', function (done) {
  //     const obj = {
  //       lastName: 'Einstein',
  //     };
  //     let lastPatches;
  //     let callCount = 0;
  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       callCount++;
  //       lastPatches = patches;
  //     });

  //     obj.lastName = 'Hawking';
  //     trigger('change');

  //     setTimeout(function () {
  //       expect(lastPatches).toEqual([
  //         {
  //           op: 'replace',
  //           path: '/lastName',
  //           value: 'Hawking',
  //         },
  //       ]);

  //       observer.unobserve();
  //       obj.lastName = 'Musk';
  //       trigger('change');

  //       setTimeout(function () {
  //         expect(callCount).toEqual(1);
  //         done();
  //       }, 20);
  //     }, 20);
  //   });
  // });
  // describe('compare', function () {
  //   variantIt(
  //     'Replacing a root array with an object should be handled well',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = ['jack'];
  //         const objB = {};
  //         const patches = jsonpatch.compare(objA, objB, testInvertible);
  //         expect(patches).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '',
  //             value: objA,
  //           }),
  //           {
  //             op: 'replace',
  //             path: '',
  //             value: objB,
  //           },
  //         ]);
  //       };
  //     }
  //   );
  //   variantIt(
  //     'Replacing an array with an object should be handled well',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const arr = ['jack'];
  //         const obj = {};
  //         const patches = jsonpatch.compare(
  //           { arr: arr },
  //           { arr: obj },
  //           testInvertible
  //         );
  //         expect(patches).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/arr',
  //             value: arr,
  //           }),
  //           {
  //             op: 'replace',
  //             path: '/arr',
  //             value: obj,
  //           },
  //         ]);
  //       };
  //     }
  //   );
  //   variantIt(
  //     'Replacing an array that nested in an object with an object nested in an an object should be handled well',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const arr = ['jack'];
  //         const obj = {};
  //         const patches = jsonpatch.compare(
  //           { arr: { deeperArray: arr } },
  //           { arr: { deeperArray: obj } },
  //           testInvertible
  //         );

  //         expect(patches).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/arr/deeperArray',
  //             value: arr,
  //           }),
  //           {
  //             op: 'replace',
  //             path: '/arr/deeperArray',
  //             value: obj,
  //           },
  //         ]);
  //       };
  //     }
  //   );
  //   variantIt(
  //     'should return an add for a property that does not exist in the first obj, without a test operation',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: {
  //             firstName: 'Albert',
  //           },
  //         };
  //         const objB = {
  //           user: {
  //             firstName: 'Albert',
  //             lastName: 'Einstein',
  //           },
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual([
  //           // no test operation, because undefined values are not serialized to JSON
  //           {
  //             op: 'add',
  //             path: '/user/lastName',
  //             value: 'Einstein',
  //           },
  //         ]);
  //       };
  //     }
  //   );

  //   variantIt(
  //     'should return test and remove for a property that does not exist in the second obj',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: {
  //             firstName: 'Albert',
  //             lastName: 'Einstein',
  //           },
  //         };
  //         const objB = {
  //           user: {
  //             firstName: 'Albert',
  //           },
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/user/lastName',
  //             value: 'Einstein',
  //           }),
  //           {
  //             op: 'remove',
  //             path: '/user/lastName',
  //           },
  //         ]);
  //       };
  //     }
  //   );

  //   variantIt(
  //     'should return test and replace for a property that exists in both',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: {
  //             firstName: 'Albert',
  //             lastName: 'Einstein',
  //           },
  //         };
  //         const objB = {
  //           user: {
  //             firstName: 'Albert',
  //             lastName: 'Collins',
  //           },
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/user/lastName',
  //             value: 'Einstein',
  //           }),
  //           {
  //             op: 'replace',
  //             path: '/user/lastName',
  //             value: 'Collins',
  //           },
  //         ]);
  //       };
  //     }
  //   );

  //   variantIt(
  //     'should replace null with object',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: null,
  //         };
  //         const objB = {
  //           user: {},
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/user',
  //             value: null,
  //           }),
  //           {
  //             op: 'replace',
  //             path: '/user',
  //             value: {},
  //           },
  //         ]);
  //       };
  //     }
  //   );

  //   variantIt(
  //     'should replace object with null',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: {},
  //         };
  //         const objB = {
  //           user: null,
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/user',
  //             value: {},
  //           }),
  //           {
  //             op: 'replace',
  //             path: '/user',
  //             value: null,
  //           },
  //         ]);
  //       };
  //     }
  //   );

  //   variantIt(
  //     'should not remove undefined',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: undefined,
  //         };
  //         const objB = {
  //           user: undefined,
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual(
  //           []
  //         );
  //       };
  //     }
  //   );

  //   variantIt(
  //     'should replace 0 with empty string',
  //     [
  //       ['invertible = FALSE', false],
  //       ['invertible = TRUE', true],
  //     ],
  //     function (testInvertible) {
  //       return function () {
  //         const objA = {
  //           user: 0,
  //         };
  //         const objB = {
  //           user: '',
  //         };

  //         expect(jsonpatch.compare(objA, objB, testInvertible)).toEqual([
  //           ...insertIf(testInvertible, {
  //             op: 'test',
  //             path: '/user',
  //             value: 0,
  //           }),
  //           {
  //             op: 'replace',
  //             path: '/user',
  //             value: '',
  //           },
  //         ]);
  //       };
  //     }
  //   );
  // });

  // describe('Registering multiple observers with the same callback', function () {
  //   it('should register only one observer', function (done) {
  //     const obj = {
  //       foo: 'bar',
  //     };

  //     const callback = jasmine.createSpy('callback');

  //     jsonpatch.observe(obj, callback);
  //     jsonpatch.observe(obj, callback);

  //     expect(callback.calls.count()).toEqual(0);

  //     obj.foo = 'bazz';

  //     trigger('keyup');

  //     setTimeout(function () {
  //       expect(callback.calls.count()).toEqual(1);
  //       done();
  //     }, 100);
  //   });

  //   it('should return the same observer if callback has been already registered)', function () {
  //     const obj = {
  //       foo: 'bar',
  //     };

  //     const callback = jasmine.createSpy('callback');

  //     const observer1 = jsonpatch.observe(obj, callback);
  //     const observer2 = jsonpatch.observe(obj, callback);

  //     expect(observer1).toBe(observer2);
  //   });

  //   it('should return a different observer if callback has been unregistered and registered again', function () {
  //     const obj = {
  //       foo: 'bar',
  //     };

  //     const callback = jasmine.createSpy('callback');

  //     const observer1 = jsonpatch.observe(obj, callback);

  //     jsonpatch.unobserve(obj, observer1);

  //     const observer2 = jsonpatch.observe(obj, callback);

  //     expect(observer1).not.toBe(observer2);
  //   });

  //   it('should not call callback on key and mouse events after unobserve', function (done) {
  //     let called = 0;

  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     const observer = jsonpatch.observe(obj, function (patches) {
  //       called++;
  //     });

  //     obj.firstName = 'Malvin';

  //     trigger('keyup');

  //     // ugly migration from Jasmine 1.x to > 2.0
  //     setTimeout(function () {
  //       expect(called).toEqual(1);

  //       jsonpatch.unobserve(obj, observer);

  //       obj.firstName = 'Wilfred';

  //       trigger('mousedown');
  //       trigger('mouseup');
  //       trigger('keydown');
  //       trigger('keyup');

  //       setTimeout(function () {
  //         expect(called).toEqual(1);
  //         done();
  //       }, 20);
  //     }, 20);
  //   });
  // });

  // describe('compare', function () {
  //   it('should return patch difference between objects', function () {
  //     const obj = {
  //       firstName: 'Albert',
  //       lastName: 'Einstein',
  //       phoneNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };
  //     const obj2 = {
  //       firstName: 'Joachim',
  //       lastName: 'Wester',
  //       mobileNumbers: [
  //         {
  //           number: '12345',
  //         },
  //         {
  //           number: '45353',
  //         },
  //       ],
  //     };

  //     const patches = jsonpatch.compare(obj, obj2);
  //     expect(patches).toEqual([
  //       {
  //         op: 'remove',
  //         path: '/phoneNumbers',
  //       },
  //       {
  //         op: 'replace',
  //         path: '/lastName',
  //         value: 'Wester',
  //       },
  //       {
  //         op: 'replace',
  //         path: '/firstName',
  //         value: 'Joachim',
  //       },
  //       {
  //         op: 'add',
  //         path: '/mobileNumbers',
  //         value: [
  //           {
  //             number: '12345',
  //           },
  //           {
  //             number: '45353',
  //           },
  //         ],
  //       },
  //     ]);
  //   });

  //   it('should not modify the source object', function () {
  //     const obj = {
  //       foo: 'bar',
  //     };
  //     jsonpatch.compare(obj, {});
  //     expect(obj.foo).toEqual('bar');
  //   });
  // });

  // it('should work with plain objects', function () {
  //   // Objects without Object prototype
  //   const one = Object.create(null);
  //   const two = Object.create(null);
  //   one.onlyOne = Object.create(null);
  //   two.onlyTwo = Object.create(null);
  //   one.both = Object.create(null);
  //   two.both = Object.create(null);
  //   expect(() => jsonpatch.compare(one, two)).not.toThrow();
  // });
});
