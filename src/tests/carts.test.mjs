import * as chai from "chai";
import supertest from "supertest";

//------------------------------------------------------------------------------------------------------------------
const expect = chai.expect
const requester = supertest("http://localhost:8080")

// Describe el conjunto de pruebas para el enrutador del carrito
describe('Cart Router', () => {
    it('Encuentra los carritos', (done) => {
        requester
            .get('/api/carts')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.status).to.equal('success');
                expect(res.body.message).to.equal('Carritos encontrados.');
                expect(res.body.data).to.be.an('array');
                done();
            });
    });
});

export { expect, requester };