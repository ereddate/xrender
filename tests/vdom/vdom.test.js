import { describe, it, expect, vi } from 'vitest';
import { VNode, VDOMUtils } from '../../src/libs/core.js';

describe('虚拟DOM测试', () => {
  it('VNode创建测试', () => {
    // 创建一个简单的VNode
    const vnode = new VNode('div', { class: 'test', id: 'test-id' }, [
      new VNode('p', {}, ['Hello']),
      new VNode('span', {}, ['World'])
    ]);
    
    // 测试VNode属性
    expect(vnode.tag).toBe('div');
    expect(vnode.attrs).toEqual({ class: 'test', id: 'test-id' });
    expect(vnode.children).toHaveLength(2);
    expect(vnode.children[0].tag).toBe('p');
    expect(vnode.children[1].tag).toBe('span');
    expect(vnode.key).toBeUndefined();
    expect(vnode.isStatic).toBe(false);
    expect(vnode.el).toBeNull();
  });
  
  it('VNode转换为真实DOM', () => {
    // 创建一个VNode
    const vnode = new VNode('div', { class: 'test', id: 'test-id' }, [
      new VNode('p', {}, ['Hello']),
      new VNode('span', {}, ['World'])
    ]);
    
    // 转换为真实DOM
    const el = VDOMUtils.createElement(vnode);
    
    // 测试真实DOM属性
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('test');
    expect(el.id).toBe('test-id');
    expect(el.children).toHaveLength(2);
    expect(el.children[0].tagName).toBe('P');
    expect(el.children[1].tagName).toBe('SPAN');
    expect(el.children[0].textContent).toBe('Hello');
    expect(el.children[1].textContent).toBe('World');
    
    // 验证VNode的el属性被正确设置
    expect(vnode.el).toBe(el);
    expect(vnode.children[0].el).toBe(el.children[0]);
    expect(vnode.children[1].el).toBe(el.children[1]);
  });
  
  it('静态节点优化测试', () => {
    // 创建一个静态VNode
    const vnode = new VNode('div', { class: 'static', static: true }, [
      new VNode('p', { static: true }, ['Static Content'])
    ]);
    
    // 转换为真实DOM
    const el = VDOMUtils.createElement(vnode);
    
    // 测试静态节点属性
    expect(el.getAttribute('data-static')).toBe('true');
    expect(vnode.isStatic).toBe(true);
  });
  
  it('文本节点测试', () => {
    // 测试纯文本VNode
    const textVNode = new VNode('#text', {}, ['Hello World']);
    const textEl = VDOMUtils.createElement(textVNode);
    expect(textEl.nodeType).toBe(3); // 文本节点
    expect(textEl.textContent).toBe('Hello World');
    
    // 测试字符串直接转换
    const stringEl = VDOMUtils.createElement('Hello String');
    expect(stringEl.nodeType).toBe(3);
    expect(stringEl.textContent).toBe('Hello String');
    
    // 测试数字直接转换
    const numberEl = VDOMUtils.createElement(42);
    expect(numberEl.nodeType).toBe(3);
    expect(numberEl.textContent).toBe('42');
  });
  
  it('属性更新测试', () => {
    // 创建两个不同属性的VNode
    const oldVnode = new VNode('div', { 
      class: 'old', 
      id: 'test',
      style: { color: 'red' }
    }, ['Content']);
    
    const newVnode = new VNode('div', { 
      class: 'new', 
      id: 'test',
      style: { color: 'blue', fontSize: '16px' }
    }, ['Content']);
    
    // 转换旧VNode为真实DOM
    const oldEl = VDOMUtils.createElement(oldVnode);
    
    // 测试属性更新
    const parentEl = document.createElement('div');
    parentEl.appendChild(oldEl);
    document.body.appendChild(parentEl);
    
    const updatedVnode = VDOMUtils.diff(oldVnode, newVnode, parentEl, 0);
    
    // 测试属性是否被正确更新
    expect(oldEl.className).toBe('new');
    expect(oldEl.id).toBe('test');
    expect(oldEl.style.color).toBe('blue');
    expect(oldEl.style.fontSize).toBe('16px');
    
    // 清理DOM
    document.body.removeChild(parentEl);
  });
  
  it('子节点diff测试', () => {
    // 创建带有不同子节点的VNode
    const oldVnode = new VNode('div', {}, [
      new VNode('p', { key: '1' }, ['Item 1']),
      new VNode('p', { key: '2' }, ['Item 2']),
      new VNode('p', { key: '3' }, ['Item 3'])
    ]);
    
    const newVnode = new VNode('div', {}, [
      new VNode('p', { key: '3' }, ['Item 3 Updated']),
      new VNode('p', { key: '1' }, ['Item 1 Updated']),
      new VNode('p', { key: '4' }, ['Item 4'])
    ]);
    
    // 转换旧VNode为真实DOM
    const oldEl = VDOMUtils.createElement(oldVnode);
    
    // 测试子节点diff
    const parentEl = document.createElement('div');
    parentEl.appendChild(oldEl);
    document.body.appendChild(parentEl);
    
    const updatedVnode = VDOMUtils.diff(oldVnode, newVnode, parentEl, 0);
    
    // 测试子节点是否被正确更新
    expect(oldEl.children).toHaveLength(3);
    expect(oldEl.children[0].textContent).toBe('Item 3 Updated');
    expect(oldEl.children[1].textContent).toBe('Item 1 Updated');
    expect(oldEl.children[2].textContent).toBe('Item 4');
    
    // 清理DOM
    document.body.removeChild(parentEl);
  });
  
  it('节点类型不同测试', () => {
    // 创建不同类型的VNode
    const oldVnode = new VNode('div', {}, ['Old Content']);
    const newVnode = new VNode('span', { class: 'new' }, ['New Content']);
    
    // 转换旧VNode为真实DOM
    const oldEl = VDOMUtils.createElement(oldVnode);
    
    // 测试节点类型不同时的替换
    const parentEl = document.createElement('div');
    parentEl.appendChild(oldEl);
    document.body.appendChild(parentEl);
    
    const updatedVnode = VDOMUtils.diff(oldVnode, newVnode, parentEl, 0);
    
    // 测试节点是否被正确替换
    expect(parentEl.children[0].tagName).toBe('SPAN');
    expect(parentEl.children[0].className).toBe('new');
    expect(parentEl.children[0].textContent).toBe('New Content');
    
    // 清理DOM
    document.body.removeChild(parentEl);
  });
});
