import { Entity, Property } from "../src/entity";
import { UniMemoryDatabase } from "../src/database"
import { Index } from "../src/indexes";


describe("collection test",() => {
    it("insert 100 and find", () => {        
        @Entity()
        class TestEntity{
            @Index()
            @Property()
            name: string;

            @Index()
            @Property()
            age: number;
        }

        const db = new UniMemoryDatabase([TestEntity]);
        const collection = db.collection(TestEntity);

        for(let i = 0; i  < 100; i++){
            collection.insertOne({
                name: "wyatt",
                age: i
            });
        }

        for(let i = 0; i < 100 ; i++){
            const results = collection.find({ age: i });
            expect(results.length).toBeGreaterThan(0);

            expect(results[0].age).toBe(i);
            expect(results[0].name).toBe("wyatt");

        }
        const results = collection.find({name: "wyatt"});
        expect(results.length).toBe(100);

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 100,
            indexSize: 100 + 1,
            reverseSize: 100
        })

    })

    it("update and find", () => {
        @Entity()
        class TestEntity{
            @Index()
            @Property()
            name: string;

            @Index()
            @Property()
            age: number;

            @Index()
            @Property()
            realAge: number;
        }

        const db = new UniMemoryDatabase([TestEntity]);
        const collection = db.collection(TestEntity);

        for(let i = 0; i  < 100; i++){
            collection.insertOne({
                name: "wyatt",
                age: i,
                realAge: i
            });
        }

        for(let i = 0; i < 100; i++){
            collection.findAndUpdate({
                realAge: i
            },{
                name: "zhy",
                age: i + 1,
            })
        }

        for(let i = 0; i < 100; i++){
            const results = collection.find({ realAge: i });
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].realAge).toBe(i);
            expect(results[0].age).toBe(i + 1);
            expect(results[0].name).toBe("zhy");
        }
        expect(collection.find({ name: "wyatt" }).length).toBe(0);
        expect(collection.find({ name: "zhy" }).length).toBe(100);

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 100,
            indexSize: 200 + 1,
            reverseSize: 100
        })

    })

    it("find and remove", () => {
        @Entity()
        class TestEntity{
            @Index()
            @Property()
            name: string;

            @Index()
            @Property()
            age: number;

            @Index()
            @Property()
            family: string;
        }

        const db = new UniMemoryDatabase([TestEntity]);
        const collection = db.collection(TestEntity);
        
        for(let i=0;i<50;i++){
            collection.insertOne({
                name: "jason",
                age: i,
                family: "family"
            })
        }
        
        for(let i=50;i<100;i++){
            collection.insertOne({
                name: "mark",
                age: i,
                family: "family"
            })
        }

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 100,
            indexSize: 100 + 1 + 1 + 1,
            reverseSize: 100
        })

        expect(collection.find({family: "family"}).length).toBe(100)
        collection.removeWhere({ name: "jason" });
        expect(collection.find({family: "family"}).length).toBe(50)
        for(let i=50;i<100;i++){
            const results = collection.find({age: i});
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].name).toBe("mark");
            expect(results[0].age).toBe(i);
            expect(results[0].family).toBe("family");
        }

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 50,
            indexSize: 50 + 1 + 1,
            reverseSize: 50
        })
    });
    
    it("union index", () => {

        @Entity()
        @Index(["x", "y"])
        class GameObjectEntity{
            @Property()
            name: string;

            @Property()
            x: number;

            @Property()
            y: number;
        }

        const db = new UniMemoryDatabase([GameObjectEntity]);
        const collection = db.collection(GameObjectEntity);

        for(let i=50;i<100;i++){
            collection.insertOne({
                x: i,
                y: i * 2,
                name: i.toString()
            })
        }

        for(let i=50;i<100;i++){
            collection.findAndUpdate({
                x: i,
                y: i * 2
            },{
                x: i / 2,
                y: i,
                name: "modified" + i
            })
        }
    
        for(let i=50;i<100;i++){
            const results = collection.find({ x: i / 2, y: i })
            expect(results.length).toBe(1);
            expect(results[0].name).toBe("modified" + i);    

            expect(collection.find({ x: i , y: i * 2 }).length).toBe(0);
        }

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 50,
            indexSize: 50,
            reverseSize: 50
        })
    })

    it("add entity by update", () => {
        @Entity()
        class TestEntity{
            @Index()
            @Property()
            name: string;

            @Index()
            @Property()
            age: number;
        }

        const db = new UniMemoryDatabase([TestEntity]);
        const collection = db.collection(TestEntity);

        const entity: any = {
            name: "zhy",
            age: 22
        };

        const entity2: any = {
            name: "zhy",
            age: 23
        }

        collection.update(entity);
        collection.update(entity2);

        expect(entity.id).toBe(0);
        expect(entity2.id).toBe(1);

        expect(collection.findOne({ id: 0 })).toBe(entity);
        expect(collection.findOne({ id: 1 })).toBe(entity2);

        collection.findAndUpdate({ name: "zhy" }, { name: "zhy2" });
        collection.removeWhere({ id : 0 })

        expect(collection.find({ name: "zhy2" }).length).toBe(1);
        expect(collection.findOne({ name: "zhy2" })).toBe(entity2);
        
        entity.name = "zhy3";
        entity2.name = "zhy3";

        delete entity.id;

        collection.update(entity)
        collection.update(entity2)

        const results = collection.find({ name: "zhy3" });
        expect(results.length).toBe(2);
        expect(entity2.id).toBe(1);
        expect(entity.id).toBe(2);

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 2,
            indexSize: 3,
            reverseSize: 2
        })
    })

    it("extending", () => {
        @Entity()
        class Animal{
            @Index()
            @Property()
            x: number;

            @Index()
            @Property()
            name: string;
        }

        @Index([ "tigerFamily", "tigerBelongs" ])
        @Entity()
        class Tiger extends Animal{
            @Index()
            @Property()
            tigerAge: number;

            @Property()
            tigerFamily: string;

            @Property()
            tigerBelongs: string;
        }

        const db = new UniMemoryDatabase([Animal, Tiger]);

        expect(db.collection(Animal)).toBe(db.collection(Tiger));
        db.collection(Tiger).insertOne({ x: 5, name: "tigerA",  tigerAge: 10, tigerFamily: "family", tigerBelongs: "belongs" });

        const collection = db.collection(Animal);
        expect(collection.findOne({ name: "tigerA" }).tigerAge).toBe(10);
        expect(collection.findOne({ x: 5 }).name).toBe("tigerA");
        expect(collection.findOne({ tigerAge: 10 }).x).toBe(5);
        expect(collection.findOne({ tigerFamily: "family", tigerBelongs: "belongs" }).tigerAge).toBe(10);

        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 1,
            indexSize: 4,
            reverseSize: 1
        })

        collection.removeWhere({ tigerFamily: "family", tigerBelongs: "belongs" })
        expect(collection.test_getIndexSize()).toStrictEqual({
            idSize: 0,
            indexSize: 0,
            reverseSize: 0
        })
    })

    it("object update", () => {
        @Entity()
        class CoolEntity{
            @Index()
            @Property()
            name: string;

            @Index()
            @Property()
            isCool: boolean;
        }

        const db = new UniMemoryDatabase([CoolEntity]);
        const newEntity = new CoolEntity();
        const col = db.collection(CoolEntity);
        
        newEntity.name = "jack";
        newEntity.isCool = true;

        col.update(newEntity);
        expect((newEntity as any).id).toBe(0);

        newEntity.isCool = false;
        col.update(newEntity)

        expect(col.findOne({ isCool: true })).toBe(undefined);
        expect(col.findOne({ isCool: false })).toBe(newEntity);
        
    })
})