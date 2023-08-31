const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors({
  origin:[],
  methods: ["POST","GET","DELETE"],
  credentials: true
}));
app.use(express.json()); 
app.use(express.static("public"));

const db = mysql.createConnection({
    host:"sql7.freesqldatabase.com",
    user:"sql7643495",
    password:"P1gXaQdrwk",
    database:"sql7643495"
})

const storage = multer.diskStorage({
  destination:(req,file,cb) =>{
    cb(null,"public/images")
  },
  filename:(req,file,cb) =>{
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  }
})

const upload = multer({
  storage : storage
})



  app.post(`/uploadProductImg/:id`,upload.single("image"),(req,res) => {
    const id = req.params.id
    const image = req.file.filename;
    console.log(image);
    const sql = "UPDATE ürünler SET image = ? WHERE id = ?";
    db.query(sql,[image,id],(err,result) => {
      if(err) return res.json({Message: "Error"});
      return res.json({Status:"success"});
    })
  })

    app.post(`/uploadCategoryImg/:id`,upload.single("image"),(req,res) => {
      const id = req.params.id
      const image = req.file.filename;
      const sql = "UPDATE kategoriler SET icon = ? WHERE id = ?";
      db.query(sql,[image,id],(err,result) => {
        if(err) return res.json({Message: "Error"});
        return res.json({Status:"success"});
      })
    })

app.get(`/getProducts/:id`, (req, res) => {
    const id = req.params.id
    const sql = "SELECT * FROM ürünler WHERE kategoriID = ?";
    db.query(sql,[id], (err, result) => {
      return res.json(result);
    });
  });  


  app.get(`/getDailyMoney/:date`, (req, res) => {
    const date = req.params.date; 
    const sql = "SELECT adet, siparis FROM complatedorders WHERE DATE(date) = ?";
    
    db.query(sql, [date], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Veritabanı hatası." });
      }
      
      const siparisIds = result.map(item => item.siparis);
  
      const sql1 = "SELECT id, fiyat FROM ürünler WHERE id IN (?)";
      
      db.query(sql1, [siparisIds], (err, products) => {
        if (err) {
          return res.status(500).json({ error: "Veritabanı hatası." });
        }
        
        let total = 0;
        
        result.forEach(item => {
          const product = products.find(prod => prod.id === item.siparis);
          if (product) {
            total += item.adet * product.fiyat;
          }
        });
  
        return res.json({ total: total });
      });
    });
  });
  
    


app.get(`/getProductsImg/:id`, (req, res) => {
    const id = req.params.id
    const sql = "SELECT image FROM ürünler WHERE kategoriID = ?";
    db.query(sql,[id], (err, result) => {
      return res.json(result);
    });
  });


app.get(`/getLikeNumber/:ürünID`, (req, res) => {
    const productId = req.params.ürünID;
    const sql = "SELECT likeNumber FROM üründetaylari WHERE ürünID = ?";
    db.query(sql, [productId], (err, result) => {
        if (err) {
            return res.json({ Message: "Error getting like number.", error: err });
        }
        return res.json(result);
    });
});

app.get(`/getDislikeNumber/:ürünID`, (req, res) => {
    const productId = req.params.ürünID;
    const sql = "SELECT dislikeNumber FROM üründetaylari WHERE ürünID = ?";
    db.query(sql, [productId], (err, result) => {
        if (err) {
            return res.json({ Message: "Error getting like number.", error: err });
        }
        return res.json(result);
    });
});

app.post(`/like/:ürünID`, (req, res) => {
    const ürünID = req.params.ürünID;
    const selectSql = "SELECT likeNumber FROM üründetaylari WHERE ürünID = ?";
    
    db.query(selectSql, [ürünID], (err, result) => {
        if (err) {
            return res.json({ Message: "Error getting like number.", error: err });
        }
        
        const currentLikeNumber = result[0].likeNumber;
        const updatedLikeNumber = currentLikeNumber + 1;

        const updateSql = "UPDATE üründetaylari SET likeNumber = ? WHERE ürünID = ?";
        
        db.query(updateSql, [updatedLikeNumber, ürünID], (err, result) => {
            if (err) {
                return res.json({ Message: "Error updating like number.", error: err });
            }
            return res.json({ Message: "Like number updated successfully." });
        });
    });
});

app.post(`/dislike/:ürünID`, (req, res) => {
    const ürünID = req.params.ürünID;
    const selectSql = "SELECT dislikeNumber FROM üründetaylari WHERE ürünID = ?";
    
    db.query(selectSql, [ürünID], (err, result) => {
        if (err) {
            return res.json({ Message: "Error getting like number.", error: err });
        }
        
        const currentDislikeNumber = result[0].dislikeNumber;
        const updatedDislikeNumber = currentDislikeNumber + 1;

        const updateSql = "UPDATE üründetaylari SET dislikeNumber = ? WHERE ürünID = ?";
        
        db.query(updateSql, [updatedDislikeNumber, ürünID], (err, result) => {
            if (err) {
                return res.json({ Message: "Error updating like number.", error: err });
            }
            return res.json({ Message: "Like number updated successfully." });
        });
    });
});

app.post("/setProduct", (req, res) => {
    const isim = req.body.isim;
    const fiyat = req.body.fiyat;
    const açıklama = req.body.açıklama;
    const kategoriID = req.body.kategoriID;
    

    const insertProductSql = "INSERT INTO ürünler (isim, fiyat, açıklama, kategoriID) VALUES (?, ?, ?, ?)";
    db.query(insertProductSql, [isim, fiyat, açıklama, kategoriID], (err, result) => {
        if (err) {
            return res.json({ Message: "Error inserting product.", error: err });
        }
        
        const productId = result.insertId; 
        
        const insertDetailsSql = "INSERT INTO üründetaylari (ürünID, likeNumber, dislikeNumber) VALUES (?, ?, ?)";
        db.query(insertDetailsSql, [productId, 0, 0], (err, detailsResult) => {
            if (err) {
                return res.json({ Message: "Error inserting product details.", error: err });
            }
            
            return res.json({
                Message: "Product inserted successfully.",
                ProductId: productId,
                DetailsResult: detailsResult
            });
        });
    });
});

app.post("/setCategory", (req, res) => {
    const kategoriName = req.body.kategoriName;

    const insertProductSql = "INSERT INTO kategoriler (kategoriName) VALUES (?)";
    db.query(insertProductSql, [kategoriName], (err, result) => {
        if (err) {
            return res.json({ Message: "Error inserting product.", error: err });
        }
        return res.json(result);
    });
});

app.get("/getAllCategories", (req, res) => {
    const sql = "SELECT * FROM kategoriler";
    db.query(sql, (err, result) => {
        if (err) {
            return res.json({ Message: "Error inserting product.", error: err });
        }
        return res.json(result);
    });
});

app.get(`/getAllStock/:kategoriID`, (req, res) => {
  const kategoriID = req.params.kategoriID;
  const sql = "SELECT id, isim FROM ürünler WHERE kategoriID = ?";
  
  db.query(sql, [kategoriID], (err, result) => {
    if (err) {
      return res.json({ Message: "Error getting product IDs and names.", error: err });
    }

    if (result.length === 0) {
      return res.json({ Message: "No products found for the given category ID." });
    }

    const productInfo = result.map(item => {
      return { id: item.id, isim: item.isim };
    });

    const productIDs = result.map(item => item.id);
    
    const stockQuery = "SELECT id, stok FROM stokbilgi WHERE id IN (?)";
    
    db.query(stockQuery, [productIDs], (err, stockResult) => {
      if (err) {
        return res.json({ Message: "Error getting stock information.", error: err });
      }

      const finalResult = productInfo.map(item => {
        const stockInfo = stockResult.find(stockItem => stockItem.id === item.id);
        return { id: item.id, isim: item.isim, stok: stockInfo ? stockInfo.stok : 0 };
      });

      return res.json(finalResult);
    });
  });
});



app.get(`/getStock/:id`, (req, res) => {
    const productId = req.params.id;
    const sql = "SELECT stok FROM stokbilgi WHERE id = ?";
    db.query(sql, [productId], (err, result) => {
        if (err) {
            return res.json({ Message: "Error getting stock number.", error: err });
        }
        return res.json(result);
    });
});

app.get(`/getCategoryName/:id`, (req, res) => {
  const id = req.params.id;
  const sql = "SELECT kategoriName FROM kategoriler WHERE id = ?";
  db.query(sql, [id], (err, result) => {
      if (err) {
          return res.json({ Message: "Error getting stock number.", error: err });
      }
      return res.json(result);
  });
});


app.post('/updateStock/:id', (req, res) => {
    const productId = req.params.id;
    const newStock = req.body.value;
  
    const checkProductQuery = "SELECT * FROM stokbilgi WHERE id = ?";
    db.query(checkProductQuery, [productId], (err, productResult) => {
      if (err) {
        return res.status(500).json({ message: "Error checking product.", error: err });
      }
  
      if (productResult.length === 0) {
        const insertProductQuery = "INSERT INTO stokbilgi (id, stok) VALUES (?, ?)";
        db.query(insertProductQuery, [productId, newStock], (insertErr, insertResult) => {
          if (insertErr) {
            return res.status(500).json({ message: "Error inserting product.", error: insertErr });
          }
          console.log("Inserted New Product Result:", insertResult);
          return res.status(200).json({ message: "Product inserted successfully." });
        });
      } else {
        const updateProductQuery = "UPDATE stokbilgi SET stok = ? WHERE id = ?";
        db.query(updateProductQuery, [newStock, productId], (updateErr, updateResult) => {
          if (updateErr) {
            return res.status(500).json({ message: "Error updating stock.", error: updateErr });
          }
          console.log("Updated Stock Result:", updateResult);
          return res.status(200).json({ message: "Stock updated successfully." });
        });
      }
    });
  });
  

app.get("/getAllProducts", (req, res) => {
    const sql = "SELECT isim,id FROM ürünler";
    db.query(sql, (err, result) => {
      if (err) {
        return res.json({ Message: "Error getting image.", error: err });
      }
      return res.json(result);
    });
  });  

app.get(`/getImage/:id`, (req, res) => {
    const productId = req.params.id;
    const sql = "SELECT image FROM ürünler WHERE id = ?";
    db.query(sql, [productId], (err, result) => {
        if (err) {
            return res.json({ Message: "Error getting image.", error: err });
        }
        
        if (result.length === 0) {
            return res.json({ Message: "Image not found." });
        }

        return res.json(result);
    });
});


app.post("/sendToCart", (req, res) => {
  const masaID = req.body.masaID;
  const siparis = req.body.siparis;
  const adet = req.body.adet;

  const selectExistingProductSql = "SELECT * FROM siparisler WHERE masaID = ? AND siparis = ?";
  db.query(selectExistingProductSql, [masaID, siparis], (selectErr, selectResult) => {
    if (selectErr) {
      return res.json({ Message: "Error selecting existing product.", error: selectErr });
    }

    if (selectResult.length > 0) {
      const existingProduct = selectResult[0];
      const updatedAdet = existingProduct.adet + adet;

      const updateProductSql = "UPDATE siparisler SET adet = ? WHERE id = ?";
      db.query(updateProductSql, [updatedAdet, existingProduct.id], (updateErr, updateResult) => {
        if (updateErr) {
          return res.json({ Message: "Error updating product.", error: updateErr });
        }

        return res.json(updateResult);
      });
    } else {
      const insertProductSql = "INSERT INTO siparisler (masaID, siparis, adet) VALUES (?, ?, ?)";
      db.query(insertProductSql, [masaID, siparis, adet], (insertErr, insertResult) => {
        if (insertErr) {
          return res.json({ Message: "Error inserting product.", error: insertErr });
        }

        return res.json(insertResult);
      });
    }
  });
});


app.get(`/getCart/:masaID`, (req, res) => {
  const masaID = req.params.masaID;
  const sql = "SELECT siparis, adet FROM siparisler WHERE masaID = ?";
  
  db.query(sql, [masaID], (err, result) => {
    if (err) {
      return res.json({ Message: "Error getting orders.", error: err });
    }

    if (result.length === 0) {
      return res.json("noProduct");
    } else {
      const products = [];
      
      result.forEach((order, i) => {
        const productId = order.siparis;
        const adet = order.adet;
        const sql1 = "SELECT id, isim, image, fiyat FROM ürünler WHERE id = ?";
        
        db.query(sql1, [productId], (err, productResult) => {
          if (err) {
            return res.json({ Message: "Error getting product information.", error: err });
          }
          
          if (productResult.length > 0) {
            const productInfo = {
              id: productResult[0].id,
              isim: productResult[0].isim,
              image: productResult[0].image,
              fiyat: productResult[0].fiyat,
              adet: adet
            };
            products.push(productInfo);
          }
          
          if (products.length === result.length) {
            return res.json(products);
          }
        });
      });
    }
  });
});


app.get(`/getTotalCart/:masaID`, (req, res) => {
  const masaID = req.params.masaID;
  const sql = "SELECT siparis FROM siparisler WHERE masaID = ?";

  db.query(sql, [masaID], (err, result) => {
    if (err) {
      return res.json({ Message: "Error getting data.", error: err });
    }
    
    const totalItems = result.length; 
    return res.json({ totalItems });
  });
});

app.post(`/arti/:siparis`, (req, res) => {
  const siparis = req.params.siparis;
  const selectSql = "SELECT adet FROM siparisler WHERE siparis = ?";
  
  db.query(selectSql, [siparis], (err, result) => {
      if (err) {
          return res.json({ Message: "Error getting like number.", error: err });
      }
      console.log(result);
      if (result.length > 0) {
        const currentAdet = result[0].adet;
        const newAdet = currentAdet + 1;
        
        const updateSql = "UPDATE siparisler SET adet = ? WHERE siparis = ?";
        
        db.query(updateSql, [newAdet, siparis], (updateErr, updateResult) => {
          if (updateErr) {
            return res.json({ Message: "Error updating adet.", error: updateErr });
          }
          
          return res.json({ Message: "Adet increased successfully." });
        });
      } else {
        return res.json({ Message: "Siparis not found." });
      }
  });
});

app.post(`/eksi/:siparis`, (req, res) => {
  const siparis = req.params.siparis;
  const selectSql = "SELECT adet FROM siparisler WHERE siparis = ?";
  
  db.query(selectSql, [siparis], (err, result) => {
      if (err) {
          return res.json({ Message: "Error getting like number.", error: err });
      }
      console.log(result);
      if (result.length > 0) {
        const currentAdet = result[0].adet;
        const newAdet = currentAdet - 1;
        
        const updateSql = "UPDATE siparisler SET adet = ? WHERE siparis = ?";
        
        db.query(updateSql, [newAdet, siparis], (updateErr, updateResult) => {
          if (updateErr) {
            return res.json({ Message: "Error updating adet.", error: updateErr });
          }
          
          return res.json({ Message: "Adet increased successfully." });
        });
      } else {
        return res.json({ Message: "Siparis not found." });
      }
  });
});

app.post("/sendToCart", (req, res) => {

  const selectExistingProductSql = "SELECT * FROM siparisler WHERE masaID = ? AND siparis = ?";
  db.query(selectExistingProductSql, [masaID, siparis], (selectErr, selectResult) => {
    if (selectErr) {
      return res.json({ Message: "Error selecting existing product.", error: selectErr });
    }

    if (selectResult.length > 0) {
      const existingProduct = selectResult[0];
      const updatedAdet = existingProduct.adet + adet;

      const updateProductSql = "UPDATE siparisler SET adet = ? WHERE id = ?";
      db.query(updateProductSql, [updatedAdet, existingProduct.id], (updateErr, updateResult) => {
        if (updateErr) {
          return res.json({ Message: "Error updating product.", error: updateErr });
        }

        return res.json(updateResult);
      });
    } else {
      const insertProductSql = "INSERT INTO siparisler (masaID, siparis, adet) VALUES (?, ?, ?)";
      db.query(insertProductSql, [masaID, siparis, adet], (insertErr, insertResult) => {
        if (insertErr) {
          return res.json({ Message: "Error inserting product.", error: insertErr });
        }

        return res.json(insertResult);
      });
    }
  });
});

app.delete('/sil/:siparisId', (req, res) => {
  const siparisId = req.params.siparisId;
  console.log(siparisId);
  const deleteQuery = 'DELETE FROM siparisler WHERE siparis = ?';

  db.query(deleteQuery, [siparisId], (error, result) => {
    if (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'An error occurred while deleting the order.' });
    } else {
      return res.json(result);
    }
  });
});

app.post("/setTable", (req, res) => {
  const id = req.body.id;

  const insertProductSql = "INSERT INTO masalar (id) VALUES (?)";
  db.query(insertProductSql, [id], (err, result) => {
      if (err) {
          return res.json({ Message: "Error inserting product.", error: err });
      }
      return res.json;
  });
});

app.delete('/deleteProduct/:id', (req, res) => {
  const id = req.params.id;

  const deleteDetailsQuery = 'DELETE FROM üründetaylari WHERE ürünID = ?';
  const deleteStockInfoQuery = 'DELETE FROM stokbilgi WHERE id = ?';

  db.query(deleteDetailsQuery, [id], (error, detailsDeleteResult) => {
    if (error) {
      console.error('Error deleting product details:', error);
      res.status(500).json({ error: 'An error occurred while deleting product details.' });
    } else {
      db.query(deleteStockInfoQuery, [id], (stockError, stockDeleteResult) => {
        if (stockError) {
          console.error('Error deleting stock info:', stockError);
          res.status(500).json({ error: 'An error occurred while deleting stock info.' });
        } else {
          const deleteProductQuery = 'DELETE FROM ürünler WHERE id = ?';
          db.query(deleteProductQuery, [id], (productError, productDeleteResult) => {
            if (productError) {
              console.error('Error deleting product:', productError);
              res.status(500).json({ error: 'An error occurred while deleting the product.' });
            } else {
              res.json(productDeleteResult);
            }
          });
        }
      });
    }
  });
});

app.delete('/deleteCategory/:id', (req, res) => {
  const id = req.params.id;

  const checkProductQuery = 'SELECT id FROM ürünler WHERE kategoriID = ?';
  db.query(checkProductQuery, [id], (checkError, checkResult) => {
    if (checkError) {
      console.error('Error checking product:', checkError);
      res.status(500).json({ error: 'An error occurred while checking for the product.' });
    } else if (checkResult.length === 0) {
      const deleteCategoryQuery = 'DELETE FROM kategoriler WHERE id = ?';
      db.query(deleteCategoryQuery, [id], (categoryError, categoryDeleteResult) => {
        if (categoryError) {
          console.error('Error deleting category:', categoryError);
          res.status(500).json({ error: 'An error occurred while deleting the category.' });
        } else {
          res.json({ message: 'Category deleted successfully.' });
        }
      });
    } else {
      res.status(400).json({ error: 'A product with this ID exists. Delete the product first.' });
    }
  });
});



app.delete('/silCart/:masaID', (req, res) => {
  const masaID = req.params.masaID;
  console.log(masaID);
  const deleteQuery = 'DELETE FROM siparisler WHERE masaID = ?';

  db.query(deleteQuery, [masaID], (error, result) => {
    if (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'An error occurred while deleting the order.' });
    } else {
      return res.json(result);
    }
  });
});


app.get("/getAllTables", (req, res) => {
  const sql = "SELECT id FROM masalar";
  db.query(sql, (err, result) => {
      if (err) {
          return res.json({ Message: "Error inserting product.", error: err });
      }
      return res.json(result);
  });
});

app.get("/getCart", (req, res) => {
  const sql = "SELECT * FROM siparisler";
  
  db.query(sql, (err, result) => {
      if (err) {
          return res.json({ Message: "Error getting image.", error: err });
      }
      
      const groupedOrders = {};  
      const totalToplamByMasa = {}; 

      for (let i = 0; i < result.length; i++) {
        const productId = result[i].siparis;
        const adet = result[i].adet;
        const masaID = result[i].masaID;
        const sql1 = "SELECT id,isim, image, fiyat FROM ürünler WHERE id = ?";
        
        db.query(sql1, [productId], (err, productResult) => {
          if (err) {
            return res.json({ Message: "Error getting image.", error: err });
          }
          
          if (productResult.length > 0) {
            const productInfo = {
              id: productResult[0].id,
              isim: productResult[0].isim,
              fiyat: productResult[0].fiyat,
              toplamFiyat: (productResult[0].fiyat) * adet,
              adet: adet
            };

            if (!groupedOrders[masaID]) {
              groupedOrders[masaID] = { masaID, orders: [productInfo] }; 
              totalToplamByMasa[masaID] = productInfo.toplamFiyat;
            } else {
              groupedOrders[masaID].orders.push(productInfo); 
              totalToplamByMasa[masaID] += productInfo.toplamFiyat;
            }
          }

          if (i === result.length - 1) {
            const mergedOrders = Object.values(groupedOrders);
            
            const responseData = {
              mergedOrders: mergedOrders,
              totalToplamByMasa: totalToplamByMasa
            };

            return res.json(responseData);
          }
        });
      }
  });
});

app.get("/getCartAdmin", (req, res) => {
  const sql = "SELECT * FROM siparisleradmin";

  db.query(sql, (err, result) => {
    if (err) {
      return res.json({ Message: "Error getting orders.", error: err });
    }

    const groupedOrders = {};
    const totalToplamByMasa = {};

    for (let i = 0; i < result.length; i++) {
      const productId = result[i].siparis;
      const adet = result[i].adet;
      const masaID = result[i].masaID;
      const date = result[i].date; 
      const sql1 = "SELECT id,isim, image, fiyat FROM ürünler WHERE id = ?";

      db.query(sql1, [productId], (err, productResult) => {
        if (err) {
          return res.json({ Message: "Error getting product information.", error: err });
        }

        if (productResult.length > 0) {
          const productInfo = {
            id: productResult[0].id,
            isim: productResult[0].isim,
            fiyat: productResult[0].fiyat,
            toplamFiyat: productResult[0].fiyat * adet,
            adet: adet,
            date: date 
          };

          if (!groupedOrders[masaID]) {
            groupedOrders[masaID] = { masaID, date, orders: [productInfo] };
            totalToplamByMasa[masaID] = productInfo.toplamFiyat;
          } else {
            groupedOrders[masaID].orders.push(productInfo);
            if (!groupedOrders[masaID].date) {
              groupedOrders[masaID].date = date;
            }
            totalToplamByMasa[masaID] += productInfo.toplamFiyat;
          }
        }

        if (i === result.length - 1) {
          const mergedOrders = Object.values(groupedOrders);

          const responseData = {
            mergedOrders: mergedOrders,
            totalToplamByMasa: totalToplamByMasa
          };

          return res.json(responseData);
        }
      });
    }
  });
});



app.get("/getCartAdminComplated", (req, res) => {
  const sql = "SELECT * FROM complatedorders";
  
  db.query(sql, (err, result) => {
      if (err) {
          return res.json({ Message: "Error getting image.", error: err });
      }
      
      const groupedOrders = {};  
      const totalToplamByMasa = {}; 

      for (let i = 0; i < result.length; i++) {
        const productId = result[i].siparis;
        const adet = result[i].adet;
        const masaID = result[i].masaID;
        const date = result[i].date; 
        const sql1 = "SELECT id,isim, image, fiyat FROM ürünler WHERE id = ?";
        
        db.query(sql1, [productId], (err, productResult) => {
          if (err) {
            return res.json({ Message: "Error getting image.", error: err });
          }
          
          if (productResult.length > 0) {
            const productInfo = {
              id: productResult[0].id,
              isim: productResult[0].isim,
              fiyat: productResult[0].fiyat,
              toplamFiyat: (productResult[0].fiyat) * adet,
              adet: adet,
              date: date 
            };

            if (!groupedOrders[masaID]) {
              groupedOrders[masaID] = { masaID,date, orders: [productInfo] }; 
              totalToplamByMasa[masaID] = productInfo.toplamFiyat;
            } else {
              groupedOrders[masaID].orders.push(productInfo); 
              totalToplamByMasa[masaID] += productInfo.toplamFiyat;
            }
          }

          if (i === result.length - 1) {
            const mergedOrders = Object.values(groupedOrders);
            
            const responseData = {
              mergedOrders: mergedOrders,
              totalToplamByMasa: totalToplamByMasa
            };

            return res.json(responseData);
          }
        });
      }
  });
});


app.get("/getCartAdminByOne/:masaID", (req, res) => {
  const requestedMasaID = req.params.masaID;
  const sql = "SELECT * FROM siparisleradmin WHERE masaID = ?";

  db.query(sql, [requestedMasaID], (err, result) => {
    if (err) {
      return res.json({ Message: "Error getting orders.", error: err });
    }

    const groupedOrders = {};
    const totalToplamByMasa = {};

    for (let i = 0; i < result.length; i++) {
      const productId = result[i].siparis;
      const adet = result[i].adet;
      const masaID = result[i].masaID;
      const sql1 = "SELECT id,isim, image, fiyat FROM ürünler WHERE id = ?";

      db.query(sql1, [productId], (err, productResult) => {
        if (err) {
          return res.json({ Message: "Error getting product info.", error: err });
        }

        if (productResult.length > 0) {
          const productInfo = {
            id: productResult[0].id,
            isim: productResult[0].isim,
            fiyat: productResult[0].fiyat,
            toplamFiyat: productResult[0].fiyat * adet,
            adet: adet,
          };

          if (!groupedOrders[masaID]) {
            groupedOrders[masaID] = { masaID, orders: [productInfo] };
            totalToplamByMasa[masaID] = productInfo.toplamFiyat;
          } else {
            groupedOrders[masaID].orders.push(productInfo);
            totalToplamByMasa[masaID] += productInfo.toplamFiyat;
          }
        }

        if (i === result.length - 1) {
          const mergedOrders = Object.values(groupedOrders);

          const responseData = {
            mergedOrders: mergedOrders,
            totalToplamByMasa: totalToplamByMasa,
          };

          return res.json(responseData);
        }
      });
    }
  });
});


app.post("/sendToCartAdmin", (req, res) => {
  console.log(req.body);
  const insertResults = [];

  for (let i = 0; i < req.body.length; i++) {
    const masaID = req.body[i].masaID;
    const siparis = req.body[i].id;
    const adet = req.body[i].adet;
    const ürünID = req.body[i].id;
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 3);
    const formattedDate = currentDate.toISOString(); 

    const selectStockSql = "SELECT stok FROM stokbilgi WHERE id = ?";
    db.query(selectStockSql, [ürünID], (selectErr, selectResult) => {
      if (selectErr) {
        console.error("Error selecting stock:", selectErr);
        insertResults.push({ success: false, error: selectErr });
      } else {
        const currentStock = selectResult[0].stok;
        if (currentStock >= adet) {
          const newStock = currentStock - adet;

          const insertProductSql = "INSERT INTO siparisleradmin (masaID, siparis, adet,date) VALUES (?, ?, ?, ?)";
          db.query(insertProductSql, [masaID, siparis, adet, formattedDate], (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Error inserting product:", insertErr);
              insertResults.push({ success: false, error: insertErr });
            } else {
              insertResults.push({ success: true, insertResult });

              const updateStockSql = "UPDATE stokbilgi SET stok = ? WHERE id = ?";
              db.query(updateStockSql, [newStock, ürünID], (updateErr, updateResult) => {
                if (updateErr) {
                  console.error("Error updating stock:", updateErr);
                }
              });
            }

            if (insertResults.length === req.body.length) {
              res.json(insertResults);
            }
          });
        } else {
          insertResults.push({ success: false, error: "Insufficient stock" });
          if (insertResults.length === req.body.length) {
            res.json(insertResults);
          }
        }
      }
    });
  }
});

app.post("/sendToComplatedOrders", (req, res) => {
  const { masaID, siparis, adet } = req.body;

  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() + 3);
  const formattedDate = currentDate.toISOString();

  const insertProductSql = "INSERT INTO complatedorders (masaID, siparis, adet, date) VALUES (?, ?, ?, ?)";
  db.query(insertProductSql, [masaID, siparis, adet, formattedDate], (insertErr, insertResult) => {
    if (insertErr) {
      console.error("Error inserting completed order:", insertErr);
      res.status(500).json({ success: false, error: insertErr });
    } else {
      res.status(200).json({ success: true, insertResult });
    }
  });
});





app.delete('/silCartAdmin/:masaID', (req, res) => {
  const masaID = req.params.masaID;
  const deleteQuery = 'DELETE FROM siparisleradmin WHERE masaID = ?';

  db.query(deleteQuery, [masaID], (error, result) => {
    if (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'An error occurred while deleting the order.' });
    } else {
      return res.json(result);
    }
  });
});

app.delete('/silCartAdminComplated/:masaID', (req, res) => {
  const masaID = req.params.masaID;
  const deleteQuery = 'DELETE FROM complatedorders WHERE masaID = ?';

  db.query(deleteQuery, [masaID], (error, result) => {
    if (error) {
      console.error('Error deleting order:', error);
      res.status(500).json({ error: 'An error occurred while deleting the order.' });
    } else {
      return res.json(result);
    }
  });
});

app.get("/getCategoryNames", (req, res) => {
  const sql = "SELECT id,kategoriName,icon FROM kategoriler";
  db.query(sql,(err,result)=>{
        if (err) {
      return res.json({ Message: "Error getting image.", error: err });
    }
    return res.json(result);
  })
});

app.get("/getAllCategoryID", (req, res) => {
  const sql = "SELECT id FROM kategoriler";
  db.query(sql,(err,result)=>{
        if (err) {
      return res.json({ Message: "Error getting image.", error: err });
    }
    return res.json(result);
  })

});


app.listen(3306,()=>{
    console.log("server is started");
})
