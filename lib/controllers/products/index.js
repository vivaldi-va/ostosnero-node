/**
 * Created by vivaldi on 9.5.2014.
 */
var ok		= require('okay');
var log		= require('npmlog');
var q		= require('q');
var _		= require('underscore');
var db		= null;

function _getProductInfo(productIdArr, next) {
	var dfd = q.defer();

	var sql = "SELECT products.id AS product_id, " +
		"products.name AS product_name, " +
		"products.picUrl AS product_thumb, " +
		"products.barcode AS product_barcode, " +
		"products.categoryID AS product_category " +
		"FROM products WHERE id IN(?)";

	db.getConnection(ok(next, function(conn) {
		conn.query(sql, [productIdArr], ok(next, function(result) {
			conn.release();

			if(result.length > 0) {
				dfd.resolve(result);
			} else {
				dfd.reject();
			}
		}));
	}));

	return dfd.promise;
}

function _searchProducts(term, next)  {
	var dfd = q.defer();

	var sql = "SELECT products.id FROM products WHERE products.name LIKE ? OR products.barcode LIKE ?";
	term = '%' + term + '%';

	db.getConnection(ok(next, function(conn) {
		conn.query(sql, [term, term], ok(next, function(result) {
			conn.release();

			if(result.length > 0) {
				var resultArr = [];
				_.each(result, function(row) {
					resultArr.push(row.id);
				});
				dfd.resolve(resultArr);
			} else {
				dfd.reject();
			}
		}));
	}));

	return dfd.promise;
}

exports.conn = function(pool) {
	db = pool;
};


exports.productInfo = function(req, res, next) {
	_getProductInfo(req.params.id, next)
		.then(
			function(result) {
				res.send(200, result[0]);
			},
			function() {
				res.send(204);
			}
		);
};


exports.search = function(req, res, next) {
	 req.assert('term', "no query entered").notEmpty();

	if(req.validationErrors()) {
		res.send(400, req.validationErrors());
	} else {
		_searchProducts(req.params.term, next)
			.then(
				function(success) {

					_getProductInfo(success, next)
						.then(function(result) {
							res.send(200, result);

						});
				}
			);
	}
};
