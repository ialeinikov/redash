import React from 'react';
import PropTypes from 'prop-types';
import { react2angular } from 'react2angular';
import Select from 'antd/lib/select';
import Input from 'antd/lib/input';
import InputNumber from 'antd/lib/input-number';
import DateParameter from '@/components/dynamic-parameters/DateParameter';
import DateRangeParameter from '@/components/dynamic-parameters/DateRangeParameter';
import { toString } from 'lodash';
import { QueryBasedParameterInput } from './QueryBasedParameterInput';

import './ParameterValueInput.less';

const { Option } = Select;

const multipleValuesProps = {
  maxTagCount: 3,
  maxTagTextLength: 10,
  maxTagPlaceholder: num => `+${num.length} more`,
};

export class ParameterValueInput extends React.Component {
  static propTypes = {
    type: PropTypes.string,
    value: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    enumOptions: PropTypes.string,
    queryId: PropTypes.number,
    parameter: PropTypes.any, // eslint-disable-line react/forbid-prop-types
    allowMultipleValues: PropTypes.bool,
    onSelect: PropTypes.func,
    className: PropTypes.string,
  };

  static defaultProps = {
    type: 'text',
    value: null,
    enumOptions: '',
    queryId: null,
    parameter: null,
    allowMultipleValues: false,
    onSelect: () => {},
    className: '',
  };

  constructor(props) {
    super(props);
    this.state = {
      value: props.parameter.hasPendingValue ? props.parameter.pendingValue : props.value,
      isDirty: props.parameter.hasPendingValue,
    };
  }

  componentDidUpdate = (prevProps) => {
    const { value, parameter } = this.props;
    // if value prop updated, reset dirty state
    if (prevProps.value !== value || prevProps.parameter !== parameter) {
      this.setState({
        value: parameter.hasPendingValue ? parameter.pendingValue : value,
        isDirty: parameter.hasPendingValue,
      });
    }
  }

  onSelect = (value) => {
    const isDirty = toString(value) !== toString(this.props.value);
    this.setState({ value, isDirty });
    this.props.onSelect(value, isDirty);
  }

  renderDateParameter() {
    const { type, parameter } = this.props;
    const { value } = this.state;
    return (
      <DateParameter
        type={type}
        className={this.props.className}
        value={value}
        parameter={parameter}
        onSelect={this.onSelect}
      />
    );
  }

  renderDateRangeParameter() {
    const { type, parameter } = this.props;
    const { value } = this.state;
    return (
      <DateRangeParameter
        type={type}
        className={this.props.className}
        value={value}
        parameter={parameter}
        onSelect={this.onSelect}
      />
    );
  }

  renderEnumInput() {
    const { enumOptions, allowMultipleValues } = this.props;
    const { value } = this.state;
    const enumOptionsArray = enumOptions.split('\n').filter(v => v !== '');
    return (
      <Select
        className={this.props.className}
        mode={allowMultipleValues ? 'multiple' : 'default'}
        optionFilterProp="children"
        disabled={enumOptionsArray.length === 0}
        value={value}
        onChange={this.onSelect}
        dropdownMatchSelectWidth={false}
        dropdownClassName="ant-dropdown-in-bootstrap-modal"
        showSearch
        showArrow
        style={{ minWidth: 60 }}
        notFoundContent={null}
        {...multipleValuesProps}
      >
        {enumOptionsArray.map(option => (<Option key={option} value={option}>{ option }</Option>))}
      </Select>
    );
  }

  renderQueryBasedInput() {
    const { queryId, parameter, allowMultipleValues } = this.props;
    const { value } = this.state;
    return (
      <QueryBasedParameterInput
        className={this.props.className}
        mode={allowMultipleValues ? 'multiple' : 'default'}
        optionFilterProp="children"
        parameter={parameter}
        value={value}
        queryId={queryId}
        onSelect={this.onSelect}
        style={{ minWidth: 60 }}
        {...multipleValuesProps}
      />
    );
  }

  renderNumberInput() {
    const { className } = this.props;
    const { value } = this.state;

    const normalize = val => !isNaN(val) && val || 0;

    return (
      <InputNumber
        className={className}
        value={normalize(value)}
        onChange={val => this.onSelect(normalize(val))}
      />
    );
  }

  renderTextInput() {
    const { className } = this.props;
    const { value } = this.state;

    return (
      <Input
        className={className}
        value={value}
        data-test="TextParamInput"
        onChange={e => this.onSelect(e.target.value)}
      />
    );
  }

  renderInput() {
    const { type } = this.props;
    switch (type) {
      case 'datetime-with-seconds':
      case 'datetime-local':
      case 'date': return this.renderDateParameter();
      case 'datetime-range-with-seconds':
      case 'datetime-range':
      case 'date-range': return this.renderDateRangeParameter();
      case 'enum': return this.renderEnumInput();
      case 'query': return this.renderQueryBasedInput();
      case 'number': return this.renderNumberInput();
      default: return this.renderTextInput();
    }
  }

  render() {
    const { isDirty } = this.state;

    return (
      <div className="parameter-input" data-dirty={isDirty || null}>
        {this.renderInput()}
      </div>
    );
  }
}

export default function init(ngModule) {
  ngModule.component('parameterValueInput', {
    template: `
      <parameter-value-input-impl
        type="$ctrl.param.type"
        value="$ctrl.param.normalizedValue"
        parameter="$ctrl.param"
        enum-options="$ctrl.param.enumOptions"
        query-id="$ctrl.param.queryId"
        allow-multiple-values="!!$ctrl.param.multiValuesOptions"
        on-select="$ctrl.setValue"
      ></parameter-value-input-impl>
    `,
    bindings: {
      param: '<',
    },
    controller($scope) {
      this.setValue = (value, isDirty) => {
        if (isDirty) {
          this.param.setPendingValue(value);
        } else {
          this.param.clearPendingValue();
        }
        $scope.$apply();
      };
    },
  });
  ngModule.component('parameterValueInputImpl', react2angular(ParameterValueInput));
}

init.init = true;
