jest.setTimeout(30000)
const crypto = require('crypto');


let Vault = require('../vault')
const bufView = [48, 0, 236, 187, 187, 172, 177, 90, 255, 184, 9, 116, 142, 96, 197, 158, 87, 35, 26, 101, 187, 30, 116, 138, 50, 131, 166, 50, 51, 197, 198, 83, 238, 167, 105, 178, 182, 108, 174, 199, 124, 141, 155, 73, 21, 85, 81, 109, 78, 233, 152, 108, 242, 238, 192, 31, 147, 86, 174, 195, 55, 229, 4, 36];
let phrase="fun rough treat scan glimpse region century purpose expire video remind second"
let pin=696969
let vault =new Vault({})

describe('getSupportedChains' , ()=>{

    test('getSupportedChains' , async()=>{
        
        let result = await new Vault().getSupportedChains()
        expect({
        evmChains: { ethereum: 'ETH', bsc: 'BSC', polygon: 'MATIC' },
        nonEvmChains: { bitcoin: 'BTC' }
      }).toMatchObject(result.response)
    })

    

   
})

describe('generateMnemonic' , ()=>{

    test('generateMnemonic' , async()=>{
        
        let result = await new Vault().generateMnemonic()
        Mnemonic=result
        expect(typeof(result)).toBe("string")
   
    })

    

   
})



describe("generateVault",()=>{

    const buf = crypto.randomBytes(64);
    const bufView = [48, 0, 236, 187, 187, 172, 177, 90, 255, 184, 9, 116, 142, 96, 197, 158, 87, 35, 26, 101, 187, 30, 116, 138, 50, 131, 166, 50, 51, 197, 198, 83, 238, 167, 105, 178, 182, 108, 174, 199, 124, 141, 155, 73, 21, 85, 81, 109, 78, 233, 152, 108, 242, 238, 192, 31, 147, 86, 174, 195, 55, 229, 4, 36];

    encrptionKey=bufView
    test('generateVault/valid case' , async()=>{
       

        let result = await  vault.generateVault(bufView,111111,Mnemonic)
        expect(result).toHaveProperty('response')
    })

    test('generateVault/empty pin' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
       
        let result = await new Vault().generateVault(bufView,null,Mnemonic)
        expect(result.error).toBe("Wrong pin type, format or length") 

    })

    test('generateVault/empty encrption key' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
        let result = await new Vault().generateVault(null,1111,Mnemonic)
        expect(result.error).toBe('Wrong pin type, format or length')
    
    })
    test('generateVault/empty encrption key' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
        let result = await new Vault().generateVault(null,111111,Mnemonic)
        expect(result.error).toBe('Please enter both encryptionKey and pin')
    
    })

    test('generateVault/empty Mnemonic' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
        try{
            let result = await new Vault().generateVault(bufView,1111,null)
        }
        catch(e){
            expect(e.message).toBe('Seed phrase is invalid.')

        }        
    
    })

    test('generateVault/all empty params' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
      
        let result = await new Vault().generateVault(null,null,null)
        expect(result.error).toBe("Wrong pin type, format or length") 
    
              
    
    })
})


describe("recoverVault",()=>{
    test('recoverVault/valid' , async()=>{
       
        let result = await vault.recoverVault(phrase,bufView,pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')
        expect(result).toHaveProperty('response')
    })
    test('recoverVault/empty phrase' , async()=>{
       try{
            let result = await vault.recoverVault(null,bufView,pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')

       }
       catch(e){
           expect(e.message).toBe('Seed phrase is invalid.')
       }
    })

    test('recoverVault/invalid phrase' , async()=>{
       try{
            let result = await vault.recoverVault("eafe",bufView,pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')

       }
       catch(e){
           expect(e.message).toBe('Seed phrase is invalid.')
       }
    })
    test('recoverVault/invalid phrase' , async()=>{
       try{
            let result = await vault.recoverVault(phrase,bufView,pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')

       }
       catch(e){
           expect(e.message).toBe('Seed phrase is invalid.')
       }
    })
    test('recoverVault/empty encryption key' , async()=>{
           let result = await vault.recoverVault(phrase,null,pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')
            expect(result).toHaveProperty('response')
      
    })
     test('recoverVault/invalid encryption key' , async()=>{
           let result = await vault.recoverVault(phrase,"fwefe",pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')
            expect(result).toHaveProperty('response')
      
    })
    test('recoverVault/empty pin' , async()=>{
       
        let result = await vault.recoverVault(phrase,bufView,null,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')
        expect(result.error).toBe("Wrong pin type, format or length") 
        
       
      
    })
    test('recoverVault/invalid pin' , async()=>{
       
        let result = await vault.recoverVault(phrase,bufView,"aefew",'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')
        expect(result.error).toBe("Wrong pin type, format or length") 
        
      
    })
    test('recoverVault/empty marshal key' , async()=>{
        try{
        let result = await vault.recoverVault(phrase,bufView,pin,null)

        }
        catch(e){
        expect(e.message).toBe("Cannot destructure property 'transactions' of 'response' as it is undefined.")

        }
      
    })
    test('recoverVault/invalid marshal key' , async()=>{
        try{
        let result = await vault.recoverVault(phrase,bufView,pin,'efrwfrw')

        }
        catch(e){
        expect(e.message).toBe("Cannot destructure property 'transactions' of 'response' as it is undefined.")

        }
      
    })
    test('recoverVault/all empty params' , async()=>{
       
        let result = await vault.recoverVault(null,null,null,null)
        expect(result.error).toBe("Wrong pin type, format or length") 
        
       
      
    })
})



