jest.setTimeout(20000)
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
       
        console.log("bufView--->",bufView)
        console.log("Mnemonic--->",Mnemonic)
        let result = await  vault.generateVault(bufView,111111,Mnemonic)
        console.log("result--->",result)
        expect(result).toHaveProperty('response')
    })

    test('generateVault/empty pin' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
        try{
            let result = await new Vault().generateVault(bufView,null,Mnemonic)

        }
        catch(e){
            expect(e).toBe('The pin should be a positive integer value')
        }

        
    
    })

    test('generateVault/empty encrption key' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
        let result = await new Vault().generateVault(null,1111,Mnemonic)
        expect(result.error).toBe('Please enter both encryptionKey and pin')
    
    })

    test('generateVault/empty Mnemonic' , async()=>{
        const buf = new ArrayBuffer(32);
        const bufView = new Uint8Array(buf);
        console.log("bufView--->",bufView.length)
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
        console.log("bufView--->",bufView.length)
        try{
            let result = await new Vault().generateVault(null,null,null)
        }
        catch(e){
            expect(e).toBe('The pin should be a positive integer value')

        }        
    
    })
})

// error to be fixed

// describe("recoverVault",()=>{
//     test('recoverVault/empty unmarshalkey' , async()=>{
       
//         let result = await vault.recoverVault(phrase,bufView,pin,'BgoGMHvB5R7iMNhZ2BoJd470aSZNEz9t2N8PBOWD')
//         console.log("recoverVault result--->",result)
//         // expect(result).toHaveProperty('response')
//     })
// })



